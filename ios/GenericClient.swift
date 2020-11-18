//
//  GenericClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 11/9/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire
import SwiftyJSON

@objc(GenericClient)
class GenericClient: NSObject {

    @objc(get:withOptions:withResolver:withRejecter:)
    func get(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .get, url: url, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    @objc(put:withOptions:withResolver:withRejecter:)
    func put(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .put, url: url, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    @objc(post:withOptions:withResolver:withRejecter:)
    func post(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .post, url: url, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    @objc(patch:withOptions:withResolver:withRejecter:)
    func patch(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .patch, url: url, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    @objc(delete:withOptions:withResolver:withRejecter:)
    func delete(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        handleRequest(method: .delete, url: url, options: JSON(options), resolve: resolve, reject: reject)
    }
    
    func handleRequest(method: HTTPMethod, url: String, options: JSON, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        let parameters = options["body"] == JSON.null ? nil : options["body"]
        let encoder: ParameterEncoder = parameters != nil ? JSONParameterEncoder.default : URLEncodedFormParameterEncoder.default
        let headers = getHTTPHeadersFrom(options: options)
        let requestModifer = getRequestModifierFrom(options: options)
        let interceptor = getInterceptorFrom(options: options)

        AF.request(url, method: method, parameters: parameters, encoder: encoder, headers: headers, interceptor: interceptor, requestModifier: requestModifer).responseJSON { json in
            resolve([
                "headers": json.response?.allHeaderFields,
                "data": json.value,
                "code": json.response?.statusCode,
                "lastRequestedUrl": json.response?.url?.absoluteString
            ])
        }
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
}
