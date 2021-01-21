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

protocol ResponseHandler {
    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Any>)
}

class NetworkClient: NSObject, ResponseHandler {
    let CONSTANTS = ["EXPONENTIAL_RETRY": "exponential"]
    



    func get(url: String, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .get, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func put(url: String, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .put, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func post(url: String, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .post, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func patch(url: String, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .patch, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func delete(url: String, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .delete, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func handleRequest(for urlString: String, withMethod method: HTTPMethod, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        handleRequest(for: url, withMethod: .delete, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func handleRequest(for url: URL, withMethod method: HTTPMethod, withSession session: Session, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        let parameters = options["body"] == JSON.null ? nil : options["body"]
        let encoder: ParameterEncoder = parameters != nil ? JSONParameterEncoder.default : URLEncodedFormParameterEncoder.default
        let headers = getHTTPHeaders(from: options)
        let requestModifer = getRequestModifier(from: options)
        let interceptor = getInterceptor(from: options)

        session.request(url, method: method, parameters: parameters, encoder: encoder, headers: headers, interceptor: interceptor, requestModifier: requestModifer).responseJSON { json in
            self.handleResponse(for: session, withUrl: url, withData: json)
            
            resolve([
                "headers": json.response?.allHeaderFields,
                "data": json.value,
                "code": json.response?.statusCode,
                "lastRequestedUrl": json.response?.url?.absoluteString
            ])
        }
    }
    
    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Any>) {}

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
        if configuration["type"].string == CONSTANTS["EXPONENTIAL_RETRY"] {
            let retryLimit = configuration["retryLimit"].uInt ?? RetryPolicy.defaultRetryLimit
            let exponentialBackoffBase = configuration["exponentialBackoffBase"].uInt ?? RetryPolicy.defaultExponentialBackoffBase
            let exponentialBackoffScale = configuration["exponentialBackoffScale"].double ?? RetryPolicy.defaultExponentialBackoffScale

            let retryPolicy = RetryPolicy(retryLimit: retryLimit, exponentialBackoffBase: exponentialBackoffBase, exponentialBackoffScale: exponentialBackoffScale)
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

    func rejectMalformed(url: String, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        let message = "Malformed URL: \(url)"
        let error = NSError(domain: "com.mattermost.react-native-network-client", code: NSURLErrorBadURL, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
}
