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

let WEBSOCKET_CONSTANTS = [
    "OPEN_EVENT": "NativeClient-WebSocket-Open",
    "CLOSE_EVENT": "NativeClient-WebSocket-Close",
    "ERROR_EVENT": "NativeClient-WebSocket-Error",
    "MESSAGE_EVENT": "NativeClient-WebSocket-Message"
]

@objc(WebSocketClient)
class WebSocketClient: RCTEventEmitter, WebSocketDelegate {
    var emitter: RCTEventEmitter!
    var hasListeners: Bool!
    
    func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func constantsToExport() -> [AnyHashable : Any]! {
        return WEBSOCKET_CONSTANTS
    }
    
    open override func supportedEvents() -> [String] {
        return Array(WEBSOCKET_CONSTANTS.values)
    }

    override func startObserving() -> Void {
        hasListeners = true;
    }

    override func stopObserving() -> Void {
        hasListeners = false;
    }

    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(urlString: String, options: Dictionary<String, Any>?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        let options = JSON(options)
        if options != JSON.null {
            // TODO: handle options
            resolve(
                WebSocketManager.default.createWebSocket(for: url, withDelegate: self)
            )

            return
        }
        
        resolve(WebSocketManager.default.createWebSocket(for: url, withDelegate: self))
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
        
        print("98dfasdf DISCONNECTING")
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
            print("WEBSOCKET CONNECTED")
            self.sendEvent(withName: WEBSOCKET_CONSTANTS["OPEN_EVENT"], body: ["url": url, "message": ["headers": headers]])
//            self.sendEvent(withName: WEBSOCKET_CONSTANTS["READY_STATE_CHANGE"], body: ["url": url, "message": 1])
        case .disconnected(let reason, let code):
            print("WEBSOCKET DISCONNECTED")
            self.sendEvent(withName: WEBSOCKET_CONSTANTS["CLOSE_EVENT"], body: ["url": url, "message": ["reason": reason, "code": code]])
        case .text(let text):
            guard let data = text.data(using: .utf16), let json = JSON(data).dictionaryObject else {
                self.sendEvent(withName: WEBSOCKET_CONSTANTS["MESSAGE_EVENT"], body: ["url": url, "message": text])
                break
            }
            self.sendEvent(withName: WEBSOCKET_CONSTANTS["MESSAGE_EVENT"], body: ["url": url, "message": json])
        case .cancelled:
            print("WEBSOCKET CANCELLED")
            self.sendEvent(withName: WEBSOCKET_CONSTANTS["CLOSE_EVENT"], body: ["url": url])
        case .error(let error):
            print("WEBSOCKET ERROR")
            self.sendEvent(withName: WEBSOCKET_CONSTANTS["ERROR_EVENT"], body: ["url": url, "message": ["error": error]])
        default:
            break
        }
        }
}
