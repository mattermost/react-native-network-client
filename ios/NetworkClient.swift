//
//  NetworkClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire
import SwiftyJSON

@objc(NetworkClient)
class NetworkClient: NSObject {
    
    @objc(createApiClientFor:withOptions:withResolver:withRejecter:)
    func createApiClientFor(baseUrl: String, options: Dictionary<String, Any>?, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        if let options = options {
            let configuration = getURLSessionConfigurationFrom(options: options)
            let redirectHandler = getRedirectHandlerFrom(options: options)

            resolve(SessionManager.default.createSession(for: baseUrl, withConfiguration: configuration, withRedirectHandler: redirectHandler))

            return
        }
        
        resolve(SessionManager.default.createSession(for: baseUrl))
    }

    @objc(addApiClientHeadersFor:withHeaders:)
    func addApiClientHeadersFor(baseUrl: String, headers: Dictionary<String, String>) -> Void {
        SessionManager.default.addSessionHeaders(for: baseUrl, additionalHeaders: headers)
    }

    @objc(getApiClientHeadersFor:withResolver:withRejecter:)
    func getApiClientHeadersFor(baseUrl: String, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        resolve(SessionManager.default.getSessionHeaders(for: baseUrl))
    }
    
    @objc(get:forEndpoint:withOptions:withResolver:withRejecter:)
    func get(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)

        if let session = SessionManager.default.getSession(for: baseUrl) {
            let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
            session.request(url, method: .get, headers: headers).responseJSON { json in
                self.resolveJSONResponse(resolve: resolve, json: json)
            }
        } else {
            AF.request(baseUrl, method: .get, headers: headers).responseJSON { json in
                resolve(["headers": json.response?.allHeaderFields, "data": json.value, "code": json.response?.statusCode])
            }
        }
    }

    @objc(put:forEndpoint:withOptions:withResolver:withRejecter:)
    func put(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])

        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)

        if let session = SessionManager.default.getSession(for: baseUrl) {
            let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
            let encoder = JSONParameterEncoder.default
            session.request(url, method: .put, parameters: parameters, encoder: encoder, headers: headers).responseJSON { json in
                self.resolveJSONResponse(resolve: resolve, json: json)
            }
        }
    }
    
    @objc(post:forEndpoint:withOptions:withResolver:withRejecter:)
    func post(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])

        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)

        if let session = SessionManager.default.getSession(for: baseUrl) {
            let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
            let encoder = JSONParameterEncoder.default
            session.request(url, method: .post, parameters: parameters, encoder: encoder, headers: headers).responseJSON { json in
                self.resolveJSONResponse(resolve: resolve, json: json)
            }
        }
    }

    @objc(patch:forEndpoint:withOptions:withResolver:withRejecter:)
    func patch(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])

        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)

        if let session = SessionManager.default.getSession(for: baseUrl) {
            let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
            let encoder = JSONParameterEncoder.default
            session.request(url, method: .patch, parameters: parameters, encoder: encoder, headers: headers).responseJSON { json in
                self.resolveJSONResponse(resolve: resolve, json: json)
            }
        }
    }

    @objc(delete:forEndpoint:withOptions:withResolver:withRejecter:)
    func delete(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])

        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)

        if let session = SessionManager.default.getSession(for: baseUrl) {
            let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
            let encoder = JSONParameterEncoder.default
            session.request(url, method: .delete, parameters: parameters, encoder: encoder, headers: headers).responseJSON { json in
                self.resolveJSONResponse(resolve: resolve, json: json)
            }
        }
    }
    
    func getURLSessionConfigurationFrom(options: Dictionary<String, Any>) -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default
        
        if let headers = RCTConvert.nsDictionary(options["headers"]) {
            config.httpAdditionalHeaders = headers
        }
        
        return config
    }

    func getRedirectHandlerFrom(options: Dictionary<String, Any>) -> RedirectHandler? {
        if let followValue = options["followRedirects"] {
            return Redirector(behavior: RCTConvert.bool(followValue) ? .follow : .doNotFollow)
        }

        return nil
    }
    
    func optionsHeadersToHTTPHeaders(headers: Dictionary<String, String>) -> HTTPHeaders {
        var httpHeaders = HTTPHeaders()
        for (name, value) in headers {
            httpHeaders.add(name: name, value: value)
        }
        return httpHeaders
    }

    func resolveJSONResponse(resolve: @escaping RCTPromiseResolveBlock, json: AFDataResponse<Any>) {
        resolve([
            "headers": json.response?.allHeaderFields,
            "data": json.value,
            "code": json.response?.statusCode,
            "lastRequestedUrl": json.response?.url?.absoluteString
        ])
    }
}
