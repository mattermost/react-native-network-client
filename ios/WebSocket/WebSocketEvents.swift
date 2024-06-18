import Foundation

@objc public protocol WebSocketClientDelegate {
    func sendEvent(name: String, result: Dictionary<String, Any>?)
}

enum WSEvents: String, CaseIterable {
    case OPEN_EVENT = "WebSocketClient-Open"
    case CLOSE_EVENT = "WebSocketClient-Close"
    case ERROR_EVENT, CLIENT_ERROR = "WebSocketClient-Error"
    case MESSAGE_EVENT = "WebSocketClient-Message"
    case READY_STATE_EVENT = "WebSocketClient-ReadyState"
}

extension WebSocketWrapper {
    @objc
    public static var supportedEvents: [String] {
        return WSEvents.allCases.map(\.rawValue)
    }
}
