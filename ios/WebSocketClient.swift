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
    internal var errorCounter: [String: Int] = [:]
    
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
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
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
        WebSocketManager.default.disconnectAll()
    }

    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(urlString: String, options: Dictionary<String, Any> = [:], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        do {
            try resolve(WebSocketManager.default.createWebSocket(for: url, withOptions: options, withDelegate: self))
        } catch {
            reject("\(error._code)", error.localizedDescription, error)
        }
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
        errorCounter[url.absoluteString] = 0
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
        
        resolve(webSocket.disconnect(closeCode: 1000))
        let wsUrl = webSocket.request.url!.absoluteString
        if hasListeners {
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": wsUrl, "message": READY_STATE["CLOSED"]!])
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLOSE_EVENT"], body: ["url": wsUrl])
        }
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

    @objc(invalidateClientFor:withResolver:withRejecter:)
    func invalidateClientFor(urlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }
 
        resolve(WebSocketManager.default.invalidateClient(for: url)) 
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
        if hasListeners {
            self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLIENT_ERROR"],
                           body: ["url": url, "errorCode": errorCode, "errorDescription": errorDescription])
        }
    }
    
    // MARK: WebSocketDelegate methods
    
    func didReceive(event: WebSocketEvent, client: WebSocket) {
        let url = client.request.url!.absoluteString

        switch event {
        case .connected(let headers):
            if hasListeners {
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["OPEN"]!])
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["OPEN_EVENT"], body: ["url": url, "message": ["headers": headers]])
            }
            errorCounter.removeValue(forKey: url)
        case .disconnected(let reason, let code):
            if hasListeners {
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLOSE_EVENT"], body: ["url": url, "message": ["reason": reason, "code": code]])
            }
        case .text(let text):
            if hasListeners {
                if let data = text.data(using: .utf16), let json = JSON(data).dictionaryObject {
                    self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["MESSAGE_EVENT"], body: ["url": url, "message": json])
                } else {
                    self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["MESSAGE_EVENT"], body: ["url": url, "message": text])
                }
            }
        case .cancelled:
            if hasListeners {
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
                self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLOSE_EVENT"], body: ["url": url])
            }
            client.disconnect(closeCode: 1001)
        case .error(let error):
            if hasListeners {
                let nsError = error as NSError?
                let errorCode = nsError?.code
                if ((errorCode == 61 || errorCode == 57) && (errorCounter[url] ?? 0) % 2 == 0) {
                    let count = errorCounter[url] ?? 0
                    errorCounter[url] = count + 1
                    self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["READY_STATE_EVENT"], body: ["url": url, "message": READY_STATE["CLOSED"]!])
                    self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["CLOSE_EVENT"], body: ["url": url, "message": ["reason": error?.localizedDescription as Any, "code": errorCode as Any]])
                } else {
                    let errorDetails: [String: Any] = [
                        "message": nsError!.description,
                    ]
                    self.sendEvent(withName: WEBSOCKET_CLIENT_EVENTS["ERROR_EVENT"], body: ["url": url, "message": ["error": errorDetails]])
                }
            }
        case .viabilityChanged(let viable):
            print("Websocket viable \(viable)")
        default:
            print("Websocket event \(event)")
            break
        }
    }
}
