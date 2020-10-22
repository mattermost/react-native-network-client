//
//  NetworkClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire

@objc(NetworkClient)
class NetworkClient: NSObject {
    
    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(rootUrl: String, options: Dictionary<String, Any>?, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        
        if let options = options {
            let config = optionsToURLSessionConfiguration(options: options)
            resolve(SessionManager.default.createSession(for: rootUrl, withConfig: config))
            return
        }
        
        resolve(SessionManager.default.createSession(for: rootUrl))
    }
    
    // @objc(request:withMethod:forEndpoint:withResolver:withRejecter:)
    // func request(rootUrl: String, method: String, endpoint: String, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        
    //     let session = SessionManager.default.getSession(for: rootUrl)
    //     session?.request(rootUrl + endpoint).responseJSON { response in
    //         resolve(response.value)
    //     }
        
    // }
    
    @objc(get:forEndpoint:withOptions:withResolver:withRejecter:)
    func get(rootUrl: String, endpoint: String, options: Dictionary<String, String>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        if let session = SessionManager.default.getSession(for: rootUrl) {
            let url = URL(string: rootUrl)!.appendingPathComponent(endpoint)
            session.request(url, method: .get).responseJSON { response in
                resolve(response.value)
            }
        } else {
            AF.request(rootUrl, method: .get).responseJSON { response in
                resolve(response.value)
            }
        }
    }
    
    @objc(post:forEndpoint:withOptions:withBody:withResolver:withRejecter:)
    func post(rootUrl: String, endpoint: String, options: Dictionary<String, String>, body: Dictionary<String, String>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        
        if let session = SessionManager.default.getSession(for: rootUrl) {
            let url = URL(string: rootUrl)!.appendingPathComponent(endpoint)
            let encoder = JSONParameterEncoder.default
            session.request(url, method: .post, parameters: body, encoder: encoder).responseJSON { response in
                resolve(response.value)
            }
        }
    }
    
    func optionsToURLSessionConfiguration(options: Dictionary<String, Any>) -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default
        
        if let httpAdditionalHeaders = RCTConvert.nsDictionary(options["additionalHeaders"]) {
            config.httpAdditionalHeaders = httpAdditionalHeaders
        }
        
        return config
    }
}
