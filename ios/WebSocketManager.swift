//
//  WebSocketManager.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 1/19/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Starscream
import SwiftyJSON

class WebSocketManager: NSObject {
    static let `default` = WebSocketManager()
    private override init() {}
    internal var webSockets: [URL: WebSocket] = [:]
    
    func webSocketCount() -> Int {
        return webSockets.count
    }
    
    func createWebSocket(for url:URL, withOptions options: Dictionary<String, Any>, withDelegate delegate: WebSocketClient) -> Void {
        let existingWebSocket = getWebSocket(for: url)
        if (existingWebSocket != nil) {
            existingWebSocket!.delegate = delegate
            return
        }
        
        var request = URLRequest(url: url)
        var compressionHandler: CompressionHandler? = nil
        var clientCredential: URLCredential? = nil

        let options = JSON(options)
        if options != JSON.null {
            if let headers = options["headers"].dictionary {
                for (key, value) in headers {
                    request.addValue(value.stringValue, forHTTPHeaderField: key)
                }
            }
            
            if let timeoutInterval = options["timeoutInterval"].double {
                request.timeoutInterval = timeoutInterval
            }
            
            if let clientP12Configuration = options["clientP12Configuration"].dictionaryObject as? [String:String] {
                let path = clientP12Configuration["path"]
                let password = clientP12Configuration["password"]
                do {
                    try Keychain.importClientP12(withPath: path!, withPassword: password, forServerUrl: url.absoluteString)
                    let (identity, certificate) = try Keychain.getClientIdentityAndCertificate(for: url.absoluteString)!
                    clientCredential = URLCredential(identity: identity, certificates: [certificate], persistence: URLCredential.Persistence.permanent)
                } catch {
                    NotificationCenter.default.post(name: Notification.Name(WEBSOCKET_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                                    object: nil,
                                                    userInfo: ["url": url.absoluteString, "errorCode": error._code, "errorDescription": error.localizedDescription])
                }
            }
            
            if options["enableCompression"].boolValue {
                compressionHandler = WSCompression()
            }
        }

        let webSocket = WebSocket(request: request, clientCredential: clientCredential, compressionHandler: compressionHandler)
        webSocket.delegate = delegate
        
        webSockets[url] = webSocket
    }
    
    func getWebSocket(for url:URL) -> WebSocket? {
        return webSockets[url]
    }

    func invalidateClient(for url:URL) -> Void {
        guard let webSocket = getWebSocket(for: url) else {
            return
        }
        
        Keychain.deleteClientP12(for: url.absoluteString)
        webSocket.forceDisconnect()
        webSocket.delegate = nil
        webSockets.removeValue(forKey: url)
    }
}
