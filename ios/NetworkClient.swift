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
    
    func rejectMalformed(url: String,
                         withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void
    
    func getInterceptor(from options: JSON) -> Interceptor?

    func getRequestAdapters(from options: JSON) -> [RequestAdapter]

    func getRequestRetriers(from options: JSON) -> [RequestRetrier]

    func getHTTPHeaders(from options: JSON) -> HTTPHeaders?

    func getRequestModifier(from options: JSON) -> Session.RequestModifier?
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
        let interceptor = getInterceptor(from: options)

        session.request(url, method: method, parameters: parameters, encoder: encoder, headers: headers, interceptor: interceptor, requestModifier: requestModifer).responseJSON { json in
            self.handleResponse(for: session, withUrl: url, withData: json)
            
            switch (json.result) {
            case .success:
                resolve([
                    "ok": true,
                    "headers": json.response?.allHeaderFields,
                    "data": json.value,
                    "code": json.response?.statusCode,
                    "lastRequestedUrl": json.response?.url?.absoluteString
                ])
            case .failure(let error):
                if (error.responseCode != nil) {
                    resolve([
                        "ok": false,
                        "headers": json.response?.allHeaderFields,
                        "data": json.value,
                        "code": error.responseCode,
                        "lastRequestedUrl": json.response?.url?.absoluteString
                    ])
                    return
                } else if error.isRequestRetryError, case let .requestRetryFailed(retryError, originalError) = error {
                    if let clientError = retryError.asNetworkClientError {
                        let description = "\(clientError.localizedDescription); Underlying Error: \(originalError.localizedDescription)"
                        reject("\(clientError.errorCode!)", description, clientError)
                        return
                    }
                }

                reject("\(error._code)", error.localizedDescription, error)
            }
        }
    }
    
    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Any>) -> Void {}
    
    func rejectMalformed(url: String, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let message = "Malformed URL: \(url)"
        let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }

    func getInterceptor(from options: JSON) -> Interceptor? {
        let adapters = getRequestAdapters(from: options)
        let retriers = getRequestRetriers(from: options)

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

    func getRequestAdapters(from options: JSON) -> [RequestAdapter] {
        var adapters = [RequestAdapter]()

        let configuration = options["requestAdapterConfiguration"]
        if let _ = configuration["bearerAuthTokenResponseHeader"].string {
            adapters.append(BearerAuthenticationAdapter())
        }
        
        return adapters
    }

    func getRequestRetriers(from options: JSON) -> [RequestRetrier] {
        var retriers = [RequestRetrier]()

        let configuration = options["retryPolicyConfiguration"]
        if configuration["type"].string == RETRY_TYPES["LINEAR_RETRY"] {
            let retryLimit = configuration["retryLimit"].uInt ?? LinearRetryPolicy.defaultRetryLimit
            let retryInterval = configuration["retryInterval"].uInt ?? LinearRetryPolicy.defaultRetryInterval

            let retryPolicy = LinearRetryPolicy(retryLimit: retryLimit, retryInterval: retryInterval)
            retriers.append(retryPolicy)
        } else if configuration["type"].string == RETRY_TYPES["EXPONENTIAL_RETRY"] {
            let retryLimit = configuration["retryLimit"].uInt ?? ExponentialRetryPolicy.defaultRetryLimit
            let exponentialBackoffBase = configuration["exponentialBackoffBase"].uInt ?? ExponentialRetryPolicy.defaultExponentialBackoffBase
            let exponentialBackoffScale = configuration["exponentialBackoffScale"].double ?? ExponentialRetryPolicy.defaultExponentialBackoffScale

            let retryPolicy = ExponentialRetryPolicy(retryLimit: retryLimit, exponentialBackoffBase: exponentialBackoffBase, exponentialBackoffScale: exponentialBackoffScale)
            retriers.append(retryPolicy)
        }

        return retriers
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
        if let timeoutInterval = options["timeoutInterval"].double {
            return { $0.timeoutInterval = timeoutInterval }
        }
        return nil
    }
}
