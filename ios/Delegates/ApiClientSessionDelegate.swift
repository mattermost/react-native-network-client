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
                    completionHandler(disposition, credential)
                    return
                }
            }
        } else if authMethod == NSURLAuthenticationMethodClientCertificate {
            if let session = SessionManager.default.getSession(for: urlSession),
               let baseUrl = session.baseUrl {
                credential = SessionManager.default.getCredential(for: baseUrl)
            }
            disposition = .useCredential
            completionHandler(disposition, credential)
            return
        }

        super.urlSession(urlSession, task: task, didReceive: challenge, completionHandler: completionHandler)
    }
    
    override open func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let err = error as? NSError,
           let urlSession = SessionManager.default.getSession(for: session),
           let baseUrl = urlSession.baseUrl,
           err.domain == NSURLErrorDomain && err.code == NSURLErrorServerCertificateUntrusted {
            NotificationCenter.default.post(name: Notification.Name(ApiEvents.CLIENT_ERROR.rawValue),
                                            object: nil,
                                            userInfo: ["serverUrl": baseUrl.absoluteString, "errorCode": APIClientError.ServerCertificateInvalid.errorCode, "errorDescription": err.localizedDescription])
        }
        super.urlSession(session, task: task, didCompleteWithError: error)
    }
}
