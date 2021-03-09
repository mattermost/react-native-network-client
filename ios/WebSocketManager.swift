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
        var certPinner: CertificatePinning? = nil;
        var compressionHandler: CompressionHandler? = nil;

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
            
            if options["enableCompression"].boolValue {
                compressionHandler = WSCompression()
            }
            
            let sslPinning = options["sslPinningConfiguration"]
            if sslPinning["enabled"].boolValue {
                certPinner = FoundationSecurity(allowSelfSigned: sslPinning["allowSelfSigned"].boolValue)
            }
        }

        let webSocket = WebSocket(request: request, certPinner: certPinner, compressionHandler: compressionHandler)
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
        
        webSocket.forceDisconnect()
        webSocket.delegate = nil
        webSockets.removeValue(forKey: url)
    }
}
