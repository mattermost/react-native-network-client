import Alamofire
import SwiftyJSON
import Network
import CoreTelephony

let RETRY_TYPES = ["EXPONENTIAL_RETRY": "exponential", "LINEAR_RETRY": "linear"]

protocol NetworkClient {
    func handleRequest(for url: String,
                       withMethod method: HTTPMethod,
                       withSession session: Session,
                       withOptions options: JSON,
                       withResolver resolve: @escaping RCTPromiseResolveBlock,
                       withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void
    
    func handleRequest(for url: URL,
                       withMethod method: HTTPMethod,
                       withSession session: Session,
                       withOptions options: JSON,
                       withResolver resolve: @escaping RCTPromiseResolveBlock,
                       withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void
    
    func handleResponse(for session: Session,
                        withUrl url: URL,
                        withData data: AFDataResponse<Data?>) -> Void
    
    func resolveOrRejectDownloadResponse(_ response: AFDownloadResponse<URL>,
                                         for request: Request?,
                                         withResolver resolve: @escaping RCTPromiseResolveBlock,
                                         withRejecter reject: @escaping RCTPromiseRejectBlock)
    
    func resolveOrRejectResponse(_ json: AFDataResponse<Data?>,
                                     for session: Session,
                                     with request: Request?,
                                     withResolver resolve: @escaping RCTPromiseResolveBlock,
                                     withRejecter reject: @escaping RCTPromiseRejectBlock)
    
    func rejectMalformed(url: String,
                         withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void
    
    func getSessionInterceptor(from options: JSON) -> Interceptor?

    func getRetryPolicy(from options: JSON, forRequest request: URLRequest?) -> RetryPolicy?

    func getHTTPHeaders(from options: JSON) -> HTTPHeaders?

    func getRequestModifier(from options: JSON) -> Session.RequestModifier?
    
    func getRedirectUrls(for request: Request) -> [String]?
}

extension NetworkClient {
    func handleRequest(for urlString: String, withMethod method: HTTPMethod, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        handleRequest(for: url, withMethod: method, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }
    
    func handleRequest(for url: URL, withMethod method: HTTPMethod, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let parameters = options["body"] == JSON.null ? nil : options["body"]
        let encoder: ParameterEncoder = parameters != nil ? JSONParameterEncoder.default : URLEncodedFormParameterEncoder.default
        let headers = getHTTPHeaders(from: options)
        let requestModifer = getRequestModifier(from: options)

        let request = session.request(url, method: method, parameters: parameters, encoder: encoder, headers: headers, requestModifier: requestModifer)
            
        request.validate(statusCode: 200...409)
            .response { response in
                self.handleResponse(for: session, withUrl: url, withData: response)
                self.resolveOrRejectResponse(response, for: session, with: request, withResolver: resolve, withRejecter: reject)
        }
    }
    
    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Data?>) -> Void {}
    
    func resolveOrRejectDownloadResponse(_ data: AFDownloadResponse<URL>,
                                         for request: Request? = nil,
                                         withResolver resolve: @escaping RCTPromiseResolveBlock,
                                         withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        data.request?.removeRetryPolicy()
        
        switch (data.result) {
        case .success:
            var ok = false
            if let statusCode = data.response?.statusCode {
                ok = (200 ... 299).contains(statusCode)
            }
            
            var response: [String: Any] = [
                "ok": ok,
                "headers": data.response?.allHeaderFields as Any,
                "data": ["path": data.fileURL?.absoluteString as Any],
                "code": data.response?.statusCode as Any,
            ]
            if let redirectUrls = getRedirectUrls(for: request!) {
                response["redirectUrls"] = redirectUrls
            }
            
            resolve(response)
        case .failure(let error):
            var responseCode = error.responseCode
            var retriesExhausted = false
            if error.isRequestRetryError, let underlyingError = error.underlyingError {
                responseCode = underlyingError.asAFError?.responseCode
                retriesExhausted = true
            }
            
            var response: [String: Any] = [
                "ok": false,
                "headers": data.response?.allHeaderFields as Any,
                "code": responseCode as Any,
                "retriesExhausted": retriesExhausted
            ]
            if let redirectUrls = getRedirectUrls(for: request!) {
                response["redirectUrls"] = redirectUrls
            }
            
            if responseCode != nil {
                resolve(response)
                return
            }

            reject("\(error._code)", error.localizedDescription, error)
        }
    }
    
    func responseToAny(_ response: AFDataResponse<Data?>) -> Any? {
        guard let data = response.data else {return nil}
        do {
            let json = try JSONSerialization.jsonObject(with: data, options: [])
            return json
        } catch {
            if let responseString = String(data: data, encoding: .utf8) {
                return responseString
            }
        }
        
        return nil
    }
    
    func resolveOrRejectResponse(_ response: AFDataResponse<Data?>,
                                     for session: Session,
                                     with request: Request? = nil,
                                     withResolver resolve: @escaping RCTPromiseResolveBlock,
                                     withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {

        response.request?.removeRetryPolicy()
        var metricsData: [String: Any]? = nil
        
        if session.collectMetrics {
            var size = response.data?.count ?? 0
            metricsData = [:]
            metricsData!["size"] = size
            
            if let metrics = response.metrics?.transactionMetrics {
                let compressedSize = metrics.compactMap { transaction in
                    guard transaction.resourceFetchType == .networkLoad else { return nil }
                    return transaction.countOfResponseBodyBytesReceived
                }.reduce(0, +)
                metricsData!["compressedSize"] = metrics.last?.countOfResponseBodyBytesReceived ?? compressedSize

                let totalLatency = metrics.compactMap { transaction in
                    (transaction.responseStartDate?.timeIntervalSince(transaction.fetchStartDate ?? Date()) ?? 0) * 1000
                }.reduce(0, +)
                metricsData!["latency"] = totalLatency
                
                let totalConnectionTime = metrics.compactMap { transaction in
                    (transaction.connectEndDate?.timeIntervalSince(transaction.connectStartDate ?? Date()) ?? 0) * 1000
                }.reduce(0, +)
                metricsData!["connectionTime"] = totalConnectionTime
                
                if let fetchStart = metrics.first?.fetchStartDate,
                   let responseEnd = metrics.last?.responseEndDate {
                    var timeTaken = responseEnd.timeIntervalSince(fetchStart)

                    
                    // Ensure timeTaken is reasonable
                    if timeTaken < 0.001 { // Cap minimum duration to avoid unrealistic speeds
                        timeTaken = 0.001
                    }
                    
                    metricsData!["startTime"] = fetchStart.timeIntervalSince1970
                    metricsData!["endTime"] = responseEnd.timeIntervalSince1970
                    metricsData!["speedInMbps"] = Double(metricsData!["compressedSize"] as! Int64 * 8) / (timeTaken * 1_000_000)
                }
                
                if let lastTransaction = metrics.last {
                    metricsData!["httpVersion"] = lastTransaction.networkProtocolName ?? "Unknown"

                    let tlsProtocolVersion: String
                    if let version = lastTransaction.negotiatedTLSProtocolVersion {
                        switch version {
                        case .TLSv12: tlsProtocolVersion = "TLS 1.2"
                        case .TLSv13: tlsProtocolVersion = "TLS 1.3"
                        case .DTLSv12:tlsProtocolVersion = "DTLS 1.2"
                        default: tlsProtocolVersion = "Unknown (\(version))"
                        }
                    } else {
                        tlsProtocolVersion = "None"
                    }
                    metricsData!["tlsVersion"] = tlsProtocolVersion
                    metricsData!["tlsCipherSuite"] = lastTransaction.interpretCipherSuite()

                    metricsData!["isCached"] = lastTransaction.resourceFetchType == .localCache
                    metricsData!["networkType"] = getNetworkType()
                }
            }
        }
        
        switch (response.result) {
        case .success:
            var ok = false
            if let statusCode = response.response?.statusCode {
                ok = (200 ... 299).contains(statusCode)
            }
            
            var data = [
                "ok": ok,
                "headers": response.response?.allHeaderFields,
                "data": responseToAny(response),
                "code": response.response?.statusCode,
            ] as [String : Any?]
            
            if session.collectMetrics && metricsData != nil {
                data["metrics"] = metricsData
            }

            if let redirectUrls = getRedirectUrls(for: request!) {
                data["redirectUrls"] = redirectUrls
            }
            
            resolve(data)
        case .failure(let error):
            var responseCode = error.responseCode
            var retriesExhausted = false

            if error.isRequestRetryError, let underlyingError = error.underlyingError {
                responseCode = underlyingError.asAFError?.responseCode
                retriesExhausted = true
            }
            
            if error.isServerTrustEvaluationError {
                session.cancelAllRequests()
                if let baseUrl = session.baseUrl {
                    NotificationCenter.default.post(name: Notification.Name(ApiEvents.CLIENT_ERROR.rawValue),
                                                    object: nil,
                                                    userInfo: [
                                                        "serverUrl": baseUrl.absoluteString,
                                                        "errorCode": APIClientError.ServerTrustEvaluationFailed.errorCode,
                                                        "errorDescription": error.localizedDescription])
                }
                
            }
            
            var data = [
                "ok": false,
                "headers": response.response?.allHeaderFields,
                "data": responseToAny(response),
                "code": responseCode,
                "retriesExhausted": retriesExhausted,
            ] as [String : Any?]

            if let request = request, let redirectUrls = getRedirectUrls(for: request) {
                data["redirectUrls"] = redirectUrls
            }
            
            if session.collectMetrics && metricsData != nil {
                data["metrics"] = metricsData
            }
            
            if responseCode != nil {
                resolve(data)
                return
            }

            reject("\(error._code)", error.localizedDescription, error)
        }
    }
    
    func rejectMalformed(url: String, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let message = "Malformed URL: \(url)"
        let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }

    func getSessionInterceptor(from options: JSON) -> Interceptor? {
        let retriers = [RuntimeRetrier()]

        var adapters = [RequestAdapter]()
        if let _ = options["requestAdapterConfiguration"]["bearerAuthTokenResponseHeader"].string {
            adapters.append(BearerAuthenticationAdapter())
        }

        if (adapters.isEmpty) {
            return Interceptor(retriers: retriers)
        }
    
        return Interceptor(adapters: adapters, retriers: retriers)
    }
    
    func getRetryPolicy(from options: JSON, forRequest request: URLRequest? = nil) -> RetryPolicy? {
        let configuration = options["retryPolicyConfiguration"]
        if configuration != JSON.null {
            var retryableHTTPMethods = RetryPolicy.defaultRetryableHTTPMethods
            if let request = request {
                retryableHTTPMethods = [request.method!]
            } else if let methodsArray = configuration["retryMethods"].array {
                retryableHTTPMethods = Set(methodsArray.map { (method) -> HTTPMethod in
                    return HTTPMethod(rawValue: method.stringValue.uppercased())
                })
            }
        
            var retryableHTTPStatusCodes = RetryPolicy.defaultRetryableHTTPStatusCodes
            if let statusCodesArray = configuration["statusCodes"].array {
                retryableHTTPStatusCodes = Set(statusCodesArray.map { (statusCode) -> Int in
                    return Int(statusCode.intValue)
                })
            }
        
            if configuration["type"].string == RETRY_TYPES["LINEAR_RETRY"] {
                let retryLimit = configuration["retryLimit"].uInt ?? LinearRetryPolicy.defaultRetryLimit
                let retryInterval = configuration["retryInterval"].uInt ?? LinearRetryPolicy.defaultRetryInterval

                return LinearRetryPolicy(retryLimit: retryLimit,
                                         retryInterval: retryInterval,
                                         retryableHTTPMethods: retryableHTTPMethods,
                                         retryableHTTPStatusCodes: retryableHTTPStatusCodes)
            } else if configuration["type"].string == RETRY_TYPES["EXPONENTIAL_RETRY"] {
                let retryLimit = configuration["retryLimit"].uInt ?? ExponentialRetryPolicy.defaultRetryLimit
                let exponentialBackoffBase = configuration["exponentialBackoffBase"].uInt ?? ExponentialRetryPolicy.defaultExponentialBackoffBase
                let exponentialBackoffScale = configuration["exponentialBackoffScale"].double ?? ExponentialRetryPolicy.defaultExponentialBackoffScale

                return ExponentialRetryPolicy(retryLimit: retryLimit,
                                              exponentialBackoffBase: exponentialBackoffBase,
                                              exponentialBackoffScale: exponentialBackoffScale,
                                              retryableHTTPMethods: retryableHTTPMethods,
                                              retryableHTTPStatusCodes: retryableHTTPStatusCodes)
            }
        }

        return nil
    }

    func getHTTPHeaders(from options: JSON) -> HTTPHeaders? {
        if let headers = options["headers"].dictionary {
            var httpHeaders = HTTPHeaders()
            for (name, value) in headers {
                httpHeaders.add(name: name, value: value.stringValue)
            }
            return httpHeaders
        }
        
        return nil
    }
    
    func getRequestModifier(from options: JSON) -> Session.RequestModifier? {
        return {
            $0.retryPolicy = getRetryPolicy(from: options, forRequest: $0)

            if let timeoutInterval = options["timeoutInterval"].double {
                $0.timeoutInterval = timeoutInterval / 1000
            }
        }
    }
    
    func getRedirectUrls(for request: Request) -> [String]? {
        var redirectUrls: [String] = []
        
        request.allMetrics.forEach { metric in
            metric.transactionMetrics.forEach { transactionMetric in
                let url = transactionMetric.request.url!.absoluteString
                if !redirectUrls.contains(url) {
                    redirectUrls.append(url)
                }
            }
        }
        
        return redirectUrls.count > 1 ? redirectUrls : nil
    }
    
    func getNetworkType() -> String {
        let monitor = NWPathMonitor()
        var networkType = "Unknown"
        let queue = DispatchQueue(label: "NetworkMonitor")
        let semaphore = DispatchSemaphore(value: 0)

        monitor.pathUpdateHandler = { path in
            if path.usesInterfaceType(.wifi) {
                networkType = "Wi-Fi"
            } else if path.usesInterfaceType(.cellular) {
                let telephonyNetworkInfo = CTTelephonyNetworkInfo()
                if let currentRadioAccessTechnology = telephonyNetworkInfo.serviceCurrentRadioAccessTechnology?.values.first {
                    if #available(iOS 14.1, *) {
                        switch currentRadioAccessTechnology {
                        case CTRadioAccessTechnologyGPRS:
                            networkType = "2G (GPRS)"
                        case CTRadioAccessTechnologyEdge:
                            networkType = "2G (EDGE)"
                        case CTRadioAccessTechnologyWCDMA:
                            networkType = "3G (WCDMA)"
                        case CTRadioAccessTechnologyHSDPA:
                            networkType = "3G (HSDPA)"
                        case CTRadioAccessTechnologyHSUPA:
                            networkType = "3G (HSUPA)"
                        case CTRadioAccessTechnologyCDMA1x:
                            networkType = "2G (CDMA1x)"
                        case CTRadioAccessTechnologyCDMAEVDORev0, CTRadioAccessTechnologyCDMAEVDORevA, CTRadioAccessTechnologyCDMAEVDORevB:
                            networkType = "3G (EVDO)"
                        case CTRadioAccessTechnologyeHRPD:
                            networkType = "3G (eHRPD)"
                        case CTRadioAccessTechnologyLTE:
                            networkType = "4G (LTE)"
                        case CTRadioAccessTechnologyNRNSA, CTRadioAccessTechnologyNR:
                            networkType = "5G"
                        default:
                            networkType = "Cellular (Unknown)"
                        }
                    } else {
                        networkType = "Cellular"
                    }
                } else {
                    networkType = "Cellular (Unknown)"
                }
            } else if path.usesInterfaceType(.wiredEthernet) {
                networkType = "Wired Ethernet"
            } else if path.usesInterfaceType(.loopback) {
                networkType = "Loopback"
            } else if path.usesInterfaceType(.other) {
                networkType = "Other"
            }
            semaphore.signal()
        }
        monitor.start(queue: queue)
        semaphore.wait() // Wait for network detection
        monitor.cancel()
        return networkType
    }
}
