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

class WebSocketManager: NSObject {
    static let `default` = WebSocketManager()
    private override init() {}
    internal var webSockets: [URL: WebSocket] = [:]
    
    func webSocketCount() -> Int {
        return webSockets.count
    }
    
    func createWebSocket(for url:URL, withDelegate delegate: WebSocketClient) -> Void {
        let existingWebSocket = getWebSocket(for: url)
        if (existingWebSocket != nil) {
            existingWebSocket!.delegate = delegate
            return
        }
        
        let request = URLRequest(url: url)
        let webSocket = WebSocket(request: request)
        webSocket.delegate = delegate
        
        webSockets[url] = webSocket
    }
    
    func getWebSocket(for url:URL) -> WebSocket? {
        return webSockets[url]
    }
}
