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

@objc(APIClient)
class APIClient: NSObject {
    
    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(baseUrl: String, options: Dictionary<String, Any>?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let options = options {
            let configuration = getURLSessionConfigurationFrom(options: options)
            let redirectHandler = getRedirectHandlerFrom(options: options)

            resolve(SessionManager.default.createSession(for: baseUrl, withConfiguration: configuration, withRedirectHandler: redirectHandler))

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

        let headers = getHTTPHeadersFrom(options: options)
        let requestModifer = getRequestModifierFrom(options: options)
        let url = URL(string: baseUrl)!.appendingPathComponent(endpoint)
        let parameters = options["body"] == JSON.null ? nil : options["body"]
        let encoder: ParameterEncoder = parameters != nil ? JSONParameterEncoder.default : URLEncodedFormParameterEncoder.default
        
        session.request(url, method: method, parameters: parameters, encoder: encoder, headers: headers, requestModifier: requestModifer).responseJSON { json in
            resolve([
                "headers": json.response?.allHeaderFields,
                "data": json.value,
                "code": json.response?.statusCode,
                "lastRequestedUrl": json.response?.url?.absoluteString
            ])
        }
    }
    
    func getURLSessionConfigurationFrom(options: Dictionary<String, Any>) -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default
        
        if let headers = RCTConvert.nsDictionary(options["headers"]) {
            config.httpAdditionalHeaders = headers
        }
        
        if let value = options["allowsCellularAccess"] {
            config.allowsCellularAccess = RCTConvert.bool(value)
        }

        if let value = options["timeoutIntervalForRequest"] {
            config.timeoutIntervalForRequest = RCTConvert.double(value)
        }

        if let value = options["timeoutIntervalForResource"] {
            config.timeoutIntervalForResource = RCTConvert.double(value)
        }
        
        if #available(iOS 11.0, *) {
            if let value = options["waitsForConnectivity"] {
                config.waitsForConnectivity = RCTConvert.bool(value)
            }
        }

        return config
    }

    func getRedirectHandlerFrom(options: Dictionary<String, Any>) -> RedirectHandler? {
        if let followValue = options["followRedirects"] {
            return Redirector(behavior: RCTConvert.bool(followValue) ? .follow : .doNotFollow)
        }

        return nil
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
