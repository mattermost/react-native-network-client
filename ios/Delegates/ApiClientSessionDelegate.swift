import Foundation
import Alamofire

class ApiClientSessionDelegate: SessionDelegate {
    override open func urlSession(_ urlSession: URLSession,
                                  task: URLSessionTask,
                                  didReceive challenge: URLAuthenticationChallenge,
                                  completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        var credential: URLCredential? = nil
        var disposition: URLSession.AuthChallengeDisposition = .performDefaultHandling

        let authMethod = challenge.protectionSpace.authenticationMethod
        if authMethod == NSURLAuthenticationMethodServerTrust {
            if let session = SessionManager.default.getSession(for: urlSession) {
                if session.trustSelfSignedServerCertificate {
                    credential = URLCredential(trust: challenge.protectionSpace.serverTrust!)
                    disposition = .useCredential
                }
            }
        } else if authMethod == NSURLAuthenticationMethodClientCertificate {
            if let session = SessionManager.default.getSession(for: urlSession) {
                credential = SessionManager.default.getCredential(for: session.baseUrl)
            }
            disposition = .useCredential
        }

        completionHandler(disposition, credential)
    }
    
    override open func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let err = error as? NSError,
           let urlSession = SessionManager.default.getSession(for: session),
           err.domain == NSURLErrorDomain && err.code == NSURLErrorServerCertificateUntrusted {
            NotificationCenter.default.post(name: Notification.Name(API_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                            object: nil,
                                            userInfo: ["serverUrl": urlSession.baseUrl.absoluteString, "errorCode": APIClientError.ServerCertificateInvalid.errorCode, "errorDescription": err.localizedDescription])
        }
        super.urlSession(session, task: task, didCompleteWithError: error)
    }
}
