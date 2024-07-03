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
    
    func createWebSocket(for url:URL, withOptions options: Dictionary<String, Any>, withDelegate delegate: WebSocketWrapper) throws -> Void {
        let existingWebSocket = getWebSocket(for: url)
        if (existingWebSocket != nil) {
            existingWebSocket!.delegate = delegate
            return
        }
        
        var request = URLRequest(url: url)
        var compressionHandler: CompressionHandler? = nil
        var clientCredential: URLCredential? = nil
        var allowSelfSign = false

        let options = JSON(options)
        if options != JSON.null {
            if let headers = options["headers"].dictionary {
                for (key, value) in headers {
                    request.addValue(value.stringValue, forHTTPHeaderField: key)
                }
            }
            
            if let timeoutInterval = options["timeoutInterval"].double {
                request.timeoutInterval = timeoutInterval / 1000
            }
            
            if let clientP12Configuration = options["clientP12Configuration"].dictionaryObject as? [String:String] {
                let path = clientP12Configuration["path"]
                let password = clientP12Configuration["password"]
                
                do {
                    try Keychain.importClientP12(withPath: path!, withPassword: password, forHost: url.host!)
                } catch KeychainError.DuplicateIdentity {
                    // do nothing
                } catch {
                    throw error
                }

                let (identity, certificate) = try Keychain.getClientIdentityAndCertificate(for: url.host!)!
                clientCredential = URLCredential(identity: identity, certificates: [certificate], persistence: URLCredential.Persistence.permanent)
            }
            
            if options["trustSelfSignedServerCertificate"].boolValue {
                allowSelfSign = true
            }
        }

        let webSocket = WebSocket(request: request, engine: WebSocketEngine(forHost: url.host, clientCredential: clientCredential, allowSelfSignCertificate: allowSelfSign))
        webSocket.delegate = delegate
        
        webSockets[url] = webSocket
    }
    
    func getWebSocket(for url:URL) -> WebSocket? {
        return webSockets[url]
    }
    
    func disconnectAll() -> Void {
        for ws in webSockets {
            ws.value.disconnect()
        }
    }

    func invalidateClient(for url:URL) -> Void {
        guard let webSocket = getWebSocket(for: url) else {
            return
        }
        
        if let _ = try? Keychain.getClientIdentityAndCertificate(for: url.host!) {
            do {
                try Keychain.deleteClientP12(for: url.host!)
            } catch {
                NotificationCenter.default.post(name: Notification.Name(WSEvents.CLIENT_ERROR.rawValue),
                                                object: nil,
                                                userInfo: ["url": url.absoluteString, "errorCode": error._code, "errorDescription": error.localizedDescription])
            }
        }
        webSocket.forceDisconnect()
        webSocket.delegate = nil
        webSockets.removeValue(forKey: url)
    }

    func invalidateContext() -> Void {
        disconnectAll()
        webSockets.removeAll()
    }
}
