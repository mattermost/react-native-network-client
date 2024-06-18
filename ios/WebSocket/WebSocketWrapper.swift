import Starscream
import SwiftyJSON
import React

var READY_STATE = [
    "CONNECTING": 0,
    "OPEN": 1,
    "CLOSING": 2,
    "CLOSED": 3,
]


@objc public class WebSocketWrapper: NSObject, WebSocketDelegate {
    @objc public weak var delegate: WebSocketClientDelegate? = nil
    internal var errorCounter: [String: Int] = [:]
    
    @objc public func captureEvents() {
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(self.errorHandler),
                                               name: Notification.Name(WSEvents.CLIENT_ERROR.rawValue),
                                               object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self,
                                                  name: Notification.Name(WSEvents.CLIENT_ERROR.rawValue),
                                                  object: nil)
    }
    
    @objc public func invalidate() {
        WebSocketManager.default.invalidateContext()
    }

    @objc public func ensureClientFor(urlString: String, options: Dictionary<String, Any> = [:], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        if WebSocketManager.default.getWebSocket(for: url) != nil {
            WebSocketManager.default.invalidateClient(for: url)
        }

        createClientFor(urlString: urlString, options: options, resolve: resolve, reject: reject)
    }

    @objc public func createClientFor(urlString: String, options: Dictionary<String, Any> = [:], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        guard WebSocketManager.default.getWebSocket(for: url) == nil else {
            rejectAlreadyExisting(withRejecter: reject);
            return
        }

        do {
            try resolve(WebSocketManager.default.createWebSocket(for: url, withOptions: options, withDelegate: self))
        } catch {
            reject("\(error._code)", error.localizedDescription, error)
        }
    }
    
    @objc public func connectFor(urlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
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
    
    @objc public func disconnectFor(urlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
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
        delegate?.sendEvent(name: WSEvents.READY_STATE_EVENT.rawValue, result: ["url": wsUrl, "message": READY_STATE["CLOSED"]!])
        delegate?.sendEvent(name: WSEvents.CLOSE_EVENT.rawValue, result: ["url": wsUrl])
    }

    @objc public func sendDataFor(urlString: String, data: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
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

    @objc public func invalidateClientFor(urlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
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
    
    func rejectAlreadyExisting(withRejecter reject: RCTPromiseRejectBlock) -> Void {
        let message = "already existing client for this websocket url"
        let error = NSError(domain: NSCocoaErrorDomain, code: NSKeyValueValidationError, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }

    @objc(errorHandler:)
    func errorHandler(notification: Notification) {
        self.sendErrorEvent(for: notification.userInfo!["url"] as! String,
                            withErrorCode: notification.userInfo!["errorCode"] as! Int,
                            withErrorDescription: notification.userInfo!["errorDescription"] as! String)
    }
    
    func sendErrorEvent(for url: String, withErrorCode errorCode: Int, withErrorDescription errorDescription: String) {
        delegate?.sendEvent(name: WSEvents.CLIENT_ERROR.rawValue,
                       result: ["url": url, "errorCode": errorCode, "errorDescription": errorDescription])
    }
    
    // MARK: WebSocketDelegate methods
    
    public func didReceive(event: WebSocketEvent, client: Starscream.WebSocketClient) {
        
        guard let url = client.url() else { return }

        switch event {
        case .connected(let headers):
            delegate?.sendEvent(name: WSEvents.READY_STATE_EVENT.rawValue, result: ["url": url, "message": READY_STATE["OPEN"]!])
            delegate?.sendEvent(name: WSEvents.OPEN_EVENT.rawValue, result: ["url": url, "message": ["headers": headers]])
            errorCounter.removeValue(forKey: url)
        case .disconnected(let reason, let code):
            delegate?.sendEvent(name: WSEvents.READY_STATE_EVENT.rawValue, result: ["url": url, "message": READY_STATE["CLOSED"]!])
            delegate?.sendEvent(name: WSEvents.CLOSE_EVENT.rawValue, result: ["url": url, "message": ["reason": reason, "code": code]])
        case .text(let text):
            if let data = text.data(using: .utf16), let json = JSON(data).dictionaryObject {
                delegate?.sendEvent(name: WSEvents.MESSAGE_EVENT.rawValue, result: ["url": url, "message": json])
            } else {
                delegate?.sendEvent(name: WSEvents.MESSAGE_EVENT.rawValue, result: ["url": url, "message": text])
            }
        case .cancelled:
            delegate?.sendEvent(name: WSEvents.READY_STATE_EVENT.rawValue, result: ["url": url, "message": READY_STATE["CLOSED"]!])
            delegate?.sendEvent(name: WSEvents.CLOSE_EVENT.rawValue, result: ["url": url])
            client.disconnect(closeCode: 1001)
        case .error(let error):
            let nsError = error as NSError?
            let errorCode = nsError?.code
            if ((errorCode == 61 || errorCode == 57) && (errorCounter[url] ?? 0) % 2 == 0) {
                let count = errorCounter[url] ?? 0
                errorCounter[url] = count + 1
                delegate?.sendEvent(name: WSEvents.READY_STATE_EVENT.rawValue, result: ["url": url, "message": READY_STATE["CLOSED"]!])
                delegate?.sendEvent(name: WSEvents.CLOSE_EVENT.rawValue, result: ["url": url, "message": ["reason": error?.localizedDescription as Any, "code": errorCode as Any]])
            } else {
                let errorDetails: [String: Any] = [
                    "message": nsError!.description,
                ]
                delegate?.sendEvent(name: WSEvents.ERROR_EVENT.rawValue, result: ["url": url, "message": ["error": errorDetails]])
            }
        case .viabilityChanged(let viable):
            print("Websocket viable \(viable)")
        default:
            print("Websocket event \(event)")
            break
        }
    }
}
