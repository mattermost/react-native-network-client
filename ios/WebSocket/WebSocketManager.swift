import Foundation
import Starscream
import SwiftyJSON

class WebSocketManager: NSObject {
    static let `default` = WebSocketManager()
    private override init() {}
    private var webSockets: [URL: WebSocket] = [:]
    private let queue = DispatchQueue(label: "com.mattermost.react-native-network-client.websocket-manager")

    func webSocketCount() -> Int {
        return queue.sync { webSockets.count }
    }

    func createWebSocket(for url:URL, withOptions options: Dictionary<String, Any>, withDelegate delegate: WebSocketWrapper) throws -> Void {
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

        queue.sync {
            if let existing = webSockets[url] {
                existing.delegate = delegate
                webSocket.delegate = nil
            } else {
                webSockets[url] = webSocket
            }
        }
    }

    func getWebSocket(for url:URL) -> WebSocket? {
        return queue.sync { webSockets[url] }
    }

    func invalidateClient(for url:URL) -> Void {
        let webSocket: WebSocket? = queue.sync {
            return webSockets.removeValue(forKey: url)
        }
        guard let webSocket = webSocket else {
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
    }

    func invalidateContext() -> Void {
        let snapshot: [WebSocket] = queue.sync {
            let values = Array(webSockets.values)
            webSockets.removeAll()
            return values
        }
        for ws in snapshot {
            ws.disconnect()
        }
    }
}
