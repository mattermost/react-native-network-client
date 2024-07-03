import Foundation
import Alamofire
import Starscream

class WebSocketEngine: SessionDelegate, Engine {
    private var task: URLSessionWebSocketTask?
    private var clientCredential: URLCredential?
    private var allowSelfSign: Bool
    weak var delegate: EngineDelegate?
    
    typealias ChallengeEvaluation = (disposition: URLSession.AuthChallengeDisposition, credential: URLCredential?)

    public init(clientCredential: URLCredential? = nil, allowSelfSignCertificate: Bool = false) {
        self.clientCredential = clientCredential
        self.allowSelfSign = allowSelfSignCertificate
    }

    public func register(delegate: EngineDelegate) {
        self.delegate = delegate
    }

    public func start(request: URLRequest) {
        let session = URLSession(configuration: URLSessionConfiguration.default, delegate: self, delegateQueue: nil)
        task = session.webSocketTask(with: request)
        doRead()
        task?.resume()
    }

    public func stop(closeCode: UInt16) {
        let closeCode = URLSessionWebSocketTask.CloseCode(rawValue: Int(closeCode)) ?? .normalClosure
        task?.cancel(with: closeCode, reason: nil)
    }

    public func forceStop() {
        stop(closeCode: UInt16(URLSessionWebSocketTask.CloseCode.abnormalClosure.rawValue))
    }

    public func write(string: String, completion: (() -> ())?) {
        task?.send(.string(string), completionHandler: { (error) in
            completion?()
        })
    }

    public func write(data: Data, opcode: FrameOpCode, completion: (() -> ())?) {
        switch opcode {
        case .binaryFrame:
            task?.send(.data(data), completionHandler: { (error) in
                completion?()
            })
        case .textFrame:
            let text = String(data: data, encoding: .utf8)!
            write(string: text, completion: completion)
        case .ping:
            task?.sendPing(pongReceiveHandler: { (error) in
                completion?()
            })
        default:
            break //unsupported
        }
    }

    private func doRead() {
        task?.receive { [weak self] (result) in
            switch result {
            case .success(let message):
                switch message {
                case .string(let string):
                    self?.broadcast(event: .text(string))
                case .data(let data):
                    self?.broadcast(event: .binary(data))
                @unknown default:
                    break
                }
                break
            case .failure(error: let err):
                self?.broadcast(event: .error(err))
                return
            }
            self?.doRead()
        }
    }

    private func broadcast(event: WebSocketEvent) {
        delegate?.didReceive(event: event)
    }

    override open func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        let p = `protocol` ?? ""
        broadcast(event: .connected(["Sec-WebSocket-Protocol": p]))
    }
    
    override open func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        var r = ""
        if let d = reason {
            r = String(data: d, encoding: .utf8) ?? ""
        }
        broadcast(event: .disconnected(r, UInt16(closeCode.rawValue)))
    }

    public func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        var evaluation: ChallengeEvaluation = (.performDefaultHandling, nil)
        switch challenge.protectionSpace.authenticationMethod {
        #if canImport(Security)
        case NSURLAuthenticationMethodServerTrust:
            if self.allowSelfSign {
                evaluation = (.useCredential, URLCredential(trust: challenge.protectionSpace.serverTrust!))
            } else {
                evaluation = attemptServerTrustAuthentication(with: challenge)
            }
        case NSURLAuthenticationMethodClientCertificate:
            if self.clientCredential != nil {
                evaluation = (.useCredential, self.clientCredential)
            }
        #endif
        default:
            evaluation = (.performDefaultHandling, nil)
        }

        completionHandler(evaluation.disposition, evaluation.credential)
    }
    
    public override func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let nsError = error as NSError?
        if nsError != nil && nsError?.code == -999 {
            broadcast(event: .disconnected(nsError!.localizedDescription, UInt16(URLSessionWebSocketTask.CloseCode.tlsHandshakeFailure.rawValue)))
            return
        }
        broadcast(event: .error(error))
    }
    
    #if canImport(Security)
    /// Evaluates the server trust `URLAuthenticationChallenge` received.
    ///
    /// - Parameter challenge: The `URLAuthenticationChallenge`.
    ///
    /// - Returns:             The `ChallengeEvaluation`.
    func attemptServerTrustAuthentication(with challenge: URLAuthenticationChallenge) -> ChallengeEvaluation {
        let host = challenge.protectionSpace.host
        
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let trust = challenge.protectionSpace.serverTrust
        else {
            return (.performDefaultHandling, nil)
        }
        
        do {
            guard let serverTrustManager = SessionManager.default.serverTrustManager else {
                return (.performDefaultHandling, nil)
            }
            
            guard let evaluator = try serverTrustManager.serverTrustEvaluator(forHost: host) else {
                return (.performDefaultHandling, nil)
            }

            try evaluator.evaluate(trust, forHost: host)

            return (.useCredential, URLCredential(trust: trust))
        } catch {
            return (.cancelAuthenticationChallenge, nil)
        }
    }
    #endif
}
