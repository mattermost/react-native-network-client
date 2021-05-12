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
class GenericClient: NSObject, NetworkClient {
    var session = Session(redirectHandler: Redirector(behavior: .follow))

    @objc(get:withOptions:withResolver:withRejecter:)
    func get(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .get, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc(put:withOptions:withResolver:withRejecter:)
    func put(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .put, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc(post:withOptions:withResolver:withRejecter:)
    func post(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .post, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc(patch:withOptions:withResolver:withRejecter:)
    func patch(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .patch, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc(delete:withOptions:withResolver:withRejecter:)
    func delete(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .delete, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
}
