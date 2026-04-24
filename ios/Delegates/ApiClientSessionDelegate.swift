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
            if let session = SessionManager.default.getSession(for: urlSession),
               let serverTrust = challenge.protectionSpace.serverTrust {
                if session.trustSelfSignedServerCertificate {
                    credential = URLCredential(trust: serverTrust)
                    disposition = .useCredential
                    completionHandler(disposition, credential)
                    return
                }

                // Capture certificate details now while SecTrust is available (#8461).
                session.lastServerCertSummary = extractCertSummary(from: serverTrust)

                // Apple's Security.framework does AIA chasing automatically, but it can
                // fail on restricted networks. If SecTrust returns a recoverable failure,
                // attempt manual AIA chain completion before falling through to the default
                // handling which would reject the connection (#9701).
                var trustResult: SecTrustResultType = .invalid
                SecTrustEvaluateWithError(serverTrust, nil)
                SecTrustGetTrustResult(serverTrust, &trustResult)

                if trustResult == .recoverableTrustFailure,
                   let augmentedTrust = AiaCertHelper.completingChain(
                       for: serverTrust,
                       host: challenge.protectionSpace.host) {
                    var retryResult: SecTrustResultType = .invalid
                    SecTrustEvaluateWithError(augmentedTrust, nil)
                    SecTrustGetTrustResult(augmentedTrust, &retryResult)
                    if retryResult == .unspecified || retryResult == .proceed {
                        completionHandler(.useCredential, URLCredential(trust: augmentedTrust))
                        return
                    }
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
            // Emit only once per session — retries would otherwise flood the JS layer (#7658).
            guard !urlSession.certErrorEmitted else {
                super.urlSession(session, task: task, didCompleteWithError: error)
                return
            }
            urlSession.certErrorEmitted = true

            let host = baseUrl.host ?? baseUrl.absoluteString
            let certInfo = urlSession.lastServerCertSummary.map { " Certificate: \($0)." } ?? ""
            let description = "The certificate for this server is invalid.\nYou might be connecting to a server that is pretending to be \"\(host)\" which could put your confidential information at risk.\(certInfo)"

            NotificationCenter.default.post(name: Notification.Name(ApiEvents.CLIENT_ERROR.rawValue),
                                            object: nil,
                                            userInfo: ["serverUrl": baseUrl.absoluteString,
                                                       "errorCode": APIClientError.ServerCertificateInvalid.errorCode,
                                                       "errorDescription": description])
        }
        super.urlSession(session, task: task, didCompleteWithError: error)
    }

    private func extractCertSummary(from serverTrust: SecTrust) -> String? {
        guard let certChain = SecTrustCopyCertificateChain(serverTrust) as? [SecCertificate],
              let leaf = certChain.first else { return nil }
        return SecCertificateCopySubjectSummary(leaf) as String?
    }
}
