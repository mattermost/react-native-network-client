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
        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)

        AF.request(url, method: .get, headers: headers).responseJSON { response in
            resolve(["headers": response.response?.allHeaderFields, "data": response.value])
        }
    }
    
    @objc(put:withOptions:withResolver:withRejecter:)
    func put(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])
        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)
        let encoder = JSONParameterEncoder.default

        AF.request(url, method: .put, parameters: parameters, encoder: encoder, headers: headers).responseJSON { response in
            resolve(["headers": response.response?.allHeaderFields, "data": response.value])
        }
    }
    
    @objc(post:withOptions:withResolver:withRejecter:)
    func post(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])
        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)
        let encoder = JSONParameterEncoder.default

        AF.request(url, method: .post, parameters: parameters, encoder: encoder, headers: headers).responseJSON { response in
            resolve(["headers": response.response?.allHeaderFields, "data": response.value])
        }
    }
    
    @objc(patch:withOptions:withResolver:withRejecter:)
    func patch(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])
        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)
        let encoder = JSONParameterEncoder.default

        AF.request(url, method: .patch, parameters: parameters, encoder: encoder, headers: headers).responseJSON { response in
            resolve(["headers": response.response?.allHeaderFields, "data": response.value])
        }
    }
    
    @objc(delete:withOptions:withResolver:withRejecter:)
    func delete(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let parameters = JSON(options["body"])
        let optionsHeaders = options["headers"] as? Dictionary<String, String> ?? [:]
        let headers = optionsHeadersToHTTPHeaders(headers: optionsHeaders)
        let encoder = JSONParameterEncoder.default

        AF.request(url, method: .delete, parameters: parameters, encoder: encoder, headers: headers).responseJSON { response in
            resolve(["headers": response.response?.allHeaderFields, "data": response.value])
        }
    }

    func optionsHeadersToHTTPHeaders(headers: Dictionary<String, String>) -> HTTPHeaders {
        var httpHeaders = HTTPHeaders()
        for (name, value) in headers {
            httpHeaders.add(name: name, value: value)
        }
        return httpHeaders
    }
}
