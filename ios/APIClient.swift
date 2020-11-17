//
//  APIClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire
import SwiftyJSON

let EXPONENTIAL_RETRY = "exponential"

@objc(APIClient)
class APIClient: NSObject {
    
    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(baseUrl: String, options: Dictionary<String, Any>?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        let options = JSON(options)
        if options != JSON.null {
            let configuration = getURLSessionConfigurationFrom(options: options)
            let redirectHandler = getRedirectHandlerFrom(options: options)
            let interceptor = getInterceptorFrom(options: options)

            resolve(SessionManager.default.createSession(for: baseUrl, withConfiguration: configuration, withInterceptor: interceptor, withRedirectHandler: redirectHandler))

            return
        }
        
        resolve(SessionManager.default.createSession(for: baseUrl))
    }

    @objc(invalidateClientFor:withResolver:withRejecter:)
    func invalidateClientFor(baseUrl: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {        
        resolve(SessionManager.default.invalidateSession(for: baseUrl))
    }

    @objc(addClientHeadersFor:withHeaders:withResolver:withRejecter:)
    func addClientHeadersFor(baseUrl: String, headers: Dictionary<String, String>, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if SessionManager.default.getSession(for: baseUrl) == nil {
            rejectInvalidSession(reject: reject, baseUrl: baseUrl)
            return
        }

        resolve(SessionManager.default.addSessionHeaders(for: baseUrl, additionalHeaders: headers))
    }

    @objc(getClientHeadersFor:withResolver:withRejecter:)
    func getClientHeadersFor(baseUrl: String, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if SessionManager.default.getSession(for: baseUrl) == nil {
            rejectInvalidSession(reject: reject, baseUrl: baseUrl)
            return
        }

        resolve(SessionManager.default.getSessionHeaders(for: baseUrl))
    }
    
    @objc(get:forEndpoint:withOptions:withResolver:withRejecter:)
    func get(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .get, baseUrl: baseUrl, endpoint: endpoint, options: JSON(options), resolve: resolve, reject: reject)
    }

    @objc(put:forEndpoint:withOptions:withResolver:withRejecter:)
    func put(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .put, baseUrl: baseUrl, endpoint: endpoint, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    @objc(post:forEndpoint:withOptions:withResolver:withRejecter:)
    func post(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .post, baseUrl: baseUrl, endpoint: endpoint, options: JSON(options), resolve: resolve, reject: reject)
    }

    @objc(patch:forEndpoint:withOptions:withResolver:withRejecter:)
    func patch(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .patch, baseUrl: baseUrl, endpoint: endpoint, options: JSON(options), resolve: resolve, reject: reject)
    }

    @objc(delete:forEndpoint:withOptions:withResolver:withRejecter:)
    func delete(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .delete, baseUrl: baseUrl, endpoint: endpoint, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    func handleRequest(method: HTTPMethod, baseUrl: String, endpoint: String, options: JSON, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let session = SessionManager.default.getSession(for: baseUrl) else {
            rejectInvalidSession(reject: reject, baseUrl: baseUrl)
            return
        }

        let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
        let parameters = options["body"] == JSON.null ? nil : options["body"]
        let encoder: ParameterEncoder = parameters != nil ? JSONParameterEncoder.default : URLEncodedFormParameterEncoder.default
        let headers = getHTTPHeadersFrom(options: options)
        let requestModifer = getRequestModifierFrom(options: options)
        let interceptor = getInterceptorFrom(options: options)
        
        if let interceptor = interceptor {
            debugPrint(interceptor)
        } else {
            print("NO INTERCEPTOR")
        }
        session.request(url, method: method, parameters: parameters, encoder: encoder, headers: headers, interceptor: interceptor, requestModifier: requestModifer).responseJSON { json in
            resolve([
                "headers": json.response?.allHeaderFields,
                "data": json.value,
                "code": json.response?.statusCode,
                "lastRequestedUrl": json.response?.url?.absoluteString
            ])
        }
    }
    
    func getURLSessionConfigurationFrom(options: JSON) -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default
        
        if let headers = options["headers"].dictionary {
            config.httpAdditionalHeaders = headers
        }
        
        if options["allowsCellularAccess"].exists() {
            config.allowsCellularAccess = options["allowsCellularAccess"].boolValue
        }

        if options["timeoutIntervalForRequest"].exists() {
            config.timeoutIntervalForRequest = options["timeoutIntervalForRequest"].doubleValue
        }

        if options["timeoutIntervalForResource"].exists() {
            config.timeoutIntervalForResource = options["timeoutIntervalForResource"].doubleValue
        }

        if options["httpMaximumConnectionsPerHost"].exists() {
            config.httpMaximumConnectionsPerHost = options["httpMaximumConnectionsPerHost"].intValue
        }
        
        if #available(iOS 11.0, *) {
            if options["waitsForConnectivity"].exists() {
                config.waitsForConnectivity = options["waitsForConnectivity"].boolValue
            }
        }

        return config
    }

    func getRedirectHandlerFrom(options: JSON) -> RedirectHandler? {
        if options["followRedirects"].exists() {
            return Redirector(behavior: options["followRedirects"].boolValue ? .follow : .doNotFollow)
        }

        return nil
    }
    
    func getInterceptorFrom(options: JSON) -> Interceptor? {
        let adapters = getRequestAdaptersFrom(options: options)
        let retriers = getRequestRetriersFrom(options: options)

        if (!adapters.isEmpty && !retriers.isEmpty) {
            return Interceptor(adapters: adapters, retriers: retriers)
        }
        if (!adapters.isEmpty) {
            return Interceptor(adapters: adapters)
        }
        if (!retriers.isEmpty) {
            return Interceptor(retriers: retriers)
        }
        
        return nil
    }
    
    func getRequestAdaptersFrom(options: JSON) -> [RequestAdapter] {
        let adapters = [RequestAdapter]()
        
        return adapters
    }

    func getRequestRetriersFrom(options: JSON) -> [RequestRetrier] {
        var retriers = [RequestRetrier]()

        let configuration = options["retryPolicyConfiguration"]
        if configuration["type"].string == EXPONENTIAL_RETRY {
            let retryLimit = configuration["retryLimit"].uInt ?? RetryPolicy.defaultRetryLimit
            let exponentialBackoffBase = configuration["exponentialBackoffBase"].uInt ?? RetryPolicy.defaultExponentialBackoffBase
            let exponentialBackoffScale = configuration["exponentialBackoffScale"].double ?? RetryPolicy.defaultExponentialBackoffScale

            let retryPolicy = RetryPolicy(retryLimit: retryLimit, exponentialBackoffBase: exponentialBackoffBase, exponentialBackoffScale: exponentialBackoffScale)
            retriers.append(retryPolicy)
        }

        return retriers
    }

    func getHTTPHeadersFrom(options: JSON) -> HTTPHeaders? {
        if let headers = options["headers"].dictionary {
            var httpHeaders = HTTPHeaders()
            for (name, value) in headers {
                httpHeaders.add(name: name, value: value.stringValue)
            }
            return httpHeaders
        }
        
        return nil
    }
    
    func getRequestModifierFrom(options: JSON) -> Session.RequestModifier? {
        if let timeoutInterval = options["timeoutInterval"].double {
            return { $0.timeoutInterval = timeoutInterval }
        }
        return nil
    }

    func rejectInvalidSession(reject: RCTPromiseRejectBlock, baseUrl: String) -> Void {
        let message = "Session for \(baseUrl) has been invalidated"
        let error = NSError(domain: "com.mattermost.react-native-network-client", code: NSCoderValueNotFoundError, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
}
