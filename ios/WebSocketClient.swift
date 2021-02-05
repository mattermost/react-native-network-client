//
//  WebSocketClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 1/18/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Starscream
import SwiftyJSON
import React

let EVENTS = [
    "OPEN_EVENT": "NetworkClient-WebSocket-Open",
    "CLOSE_EVENT": "NetworkClient-WebSocket-Close",
    "ERROR_EVENT": "NetworkClient-WebSocket-Error",
    "MESSAGE_EVENT": "NetworkClient-WebSocket-Message",
    "READY_STATE_EVENT": "NetworkClient-WebSocket-ReadyState",
]

let READY_STATE = [
    "CONNECTING": 0,
    "OPEN": 1,
    "CLOSING": 2,
    "CLOSED": 3,
]

@objc(WebSocketClient)
class WebSocketClient: RCTEventEmitter, WebSocketDelegate {
    var emitter: RCTEventEmitter!
    var hasListeners: Bool!
    
    func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func constantsToExport() -> [AnyHashable : Any]! {
        return ["EVENTS": EVENTS, "READY_STATE": READY_STATE]
    }
    
    open override func supportedEvents() -> [String] {
        return Array(EVENTS.values)
    }

    override func startObserving() -> Void {
        hasListeners = true;
    }

    override func stopObserving() -> Void {
        hasListeners = false;
    }

    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(urlString: String, options: Dictionary<String, Any> = [:], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        resolve(WebSocketManager.default.createWebSocket(for: url, withOptions: options, withDelegate: self))
    }
    
    @objc(connectFor:withResolver:withRejecter:)
    func connectFor(urlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        guard let webSocket = WebSocketManager.default.getWebSocket(for: url) else {
            rejectInvalidWebSocket(for: url, withRejecter: reject)
            return
        }
        
        resolve(webSocket.connect())
    }
    
    @objc(disconnectFor:withResolver:withRejecter:)
    func disconnectFor(urlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        guard let webSocket = WebSocketManager.default.getWebSocket(for: url) else {
            rejectInvalidWebSocket(for: url, withRejecter: reject)
            return
        }
        
        resolve(webSocket.disconnect())
    }

    @objc(sendDataFor:withData:withResolver:withRejecter:)
    func sendDataFor(urlString: String, data: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        guard let webSocket = WebSocketManager.default.getWebSocket(for: url) else {
            rejectInvalidWebSocket(for: url, withRejecter: reject)
            return
        }

        resolve(webSocket.write(string: data))        
    }
    
    func rejectMalformed(url: String, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        let message = "Malformed URL: \(url)"
        let error = NSError(domain: "com.mattermost.react-native-network-client", code: NSURLErrorBadURL, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
    
    func rejectInvalidWebSocket(for url: URL, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        let message = "WebSocket for \(url.absoluteString) has been invalidated"
        let error = NSError(domain: "com.mattermost.react-native-network-client", code: NSCoderValueNotFoundError, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
    
    func didReceive(event: WebSocketEvent, client: WebSocket) {
        let url = client.request.url!.absoluteString

        switch event {
        case .connected(let headers):
            self.sendEvent(withName: EVENTS["OPEN_EVENT"], body: ["url": url, "message": ["headers": headers]])
            self.sendEvent(withName: EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["OPEN"]!])
        case .disconnected(let reason, let code):
            self.sendEvent(withName: EVENTS["CLOSE_EVENT"], body: ["url": url, "message": ["reason": reason, "code": code]])
        case .text(let text):
            if let data = text.data(using: .utf16), let json = JSON(data).dictionaryObject {
                self.sendEvent(withName: EVENTS["MESSAGE_EVENT"], body: ["url": url, "message": json])
            } else {
                self.sendEvent(withName: EVENTS["MESSAGE_EVENT"], body: ["url": url, "message": text])
            }
        case .cancelled:
            self.sendEvent(withName: EVENTS["CLOSE_EVENT"], body: ["url": url])
            self.sendEvent(withName: EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
        case .error(let error):
            self.sendEvent(withName: EVENTS["ERROR_EVENT"], body: ["url": url, "message": ["error": error]])
            self.sendEvent(withName: EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
        default:
            break
        }
        }
}
