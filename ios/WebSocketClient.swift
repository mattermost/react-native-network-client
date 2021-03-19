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

let WEBSOCKET_CLIENT_EVENTS = [
    "OPEN_EVENT": "WebSocketClient-Open",
    "CLOSE_EVENT": "WebSocketClient-Close",
    "ERROR_EVENT": "WebSocketClient-Error",
    "MESSAGE_EVENT": "WebSocketClient-Message",
    "READY_STATE_EVENT": "WebSocketClient-ReadyState",
    "CLIENT_ERROR": "WebSocketClient-Error"
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
    
    override init() {
        super.init()
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(self.errorHandler),
                                               name: Notification.Name(WEBSOCKET_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                               object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self,
                                                  name: Notification.Name(WEBSOCKET_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                                  object: nil)
    }
    
    func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func constantsToExport() -> [AnyHashable : Any]! {
        return ["EVENTS": WEBSOCKET_CLIENT_EVENTS, "READY_STATE": READY_STATE]
    }
    
    open override func supportedEvents() -> [String] {
        return Array(WEBSOCKET_CLIENT_EVENTS.values)
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
        let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
    
    func rejectInvalidWebSocket(for url: URL, withRejecter reject: RCTPromiseRejectBlock) -> Void {
        let message = "WebSocket for \(url.absoluteString) has been invalidated"
        let error = NSError(domain: NSCocoaErrorDomain, code: NSCoderValueNotFoundError, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
    
    @objc(errorHandler:)
    func errorHandler(notification: Notification) {
        self.sendErrorEvent(for: notification.userInfo!["url"] as! String,
                            withErrorCode: notification.userInfo!["errorCode"] as! Int,
                            withErrorDescription: notification.userInfo!["errorDescription"] as! String)
    }
    
    func sendErrorEvent(for url: String, withErrorCode errorCode: Int, withErrorDescription errorDescription: String) {
        self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLIENT_ERROR"],
                       body: ["url": url, "errorCode": errorCode, "errorDescription": errorDescription])
    }
    
    // MARK: WebSocketDelegate methods
    
    func didReceive(event: WebSocketEvent, client: WebSocket) {
        let url = client.request.url!.absoluteString

        switch event {
        case .connected(let headers):
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["OPEN_EVENT"], body: ["url": url, "message": ["headers": headers]])
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["OPEN"]!])
        case .disconnected(let reason, let code):
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLOSE_EVENT"], body: ["url": url, "message": ["reason": reason, "code": code]])
        case .text(let text):
            if let data = text.data(using: .utf16), let json = JSON(data).dictionaryObject {
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["MESSAGE_EVENT"], body: ["url": url, "message": json])
            } else {
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["MESSAGE_EVENT"], body: ["url": url, "message": text])
            }
        case .cancelled:
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLOSE_EVENT"], body: ["url": url])
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
        case .error(let error):
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["ERROR_EVENT"], body: ["url": url, "message": ["error": error]])
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
        default:
            break
        }
    }
}
