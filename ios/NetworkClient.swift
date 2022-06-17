//
//  NetworkClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 11/30/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire
import SwiftyJSON

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
                        withData data: AFDataResponse<Any>) -> Void
    
    func resolveOrRejectDownloadResponse(_ response: AFDownloadResponse<URL>,
                                         for request: Request?,
                                         withResolver resolve: @escaping RCTPromiseResolveBlock,
                                         withRejecter reject: @escaping RCTPromiseRejectBlock)
    
    func resolveOrRejectJSONResponse(_ json: AFDataResponse<Any>,
                                     for request: Request?,
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
            .responseJSON { json in
                self.handleResponse(for: session, withUrl: url, withData: json)
                self.resolveOrRejectJSONResponse(json, for: request, withResolver: resolve, withRejecter: reject)
        }
    }
    
    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Any>) -> Void {}
    
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
    
    func resolveOrRejectJSONResponse(_ json: AFDataResponse<Any>,
                                     for request: Request? = nil,
                                     withResolver resolve: @escaping RCTPromiseResolveBlock,
                                     withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {

        json.request?.removeRetryPolicy()
        
        switch (json.result) {
        case .success:
            var ok = false
            if let statusCode = json.response?.statusCode {
                ok = (200 ... 299).contains(statusCode)
            }

            var response = [
                "ok": ok,
                "headers": json.response?.allHeaderFields,
                "data": json.value,
                "code": json.response?.statusCode,
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
            
            var response = [
                "ok": false,
                "headers": json.response?.allHeaderFields,
                "data": json.value,
                "code": responseCode,
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
}
