import Foundation

extension SessionManager {
    @objc public func getSessionBaseUrl(for request:URLRequest) -> URL? {
        return getSession(for: request)?.baseUrl
    }
    
    @objc public func getSessionConfiguration(for baseUrl:URL) -> URLSessionConfiguration? {
        return getSession(for: baseUrl)?.session.configuration
    }
    
    @objc public func getTrustSelfSignedServerCertificate(for baseUrl:URL) -> Bool {
        return getSession(for: baseUrl)?.trustSelfSignedServerCertificate ?? false
    }
    
    @objc public func getCredential(for baseUrl:URL) -> URLCredential? {
        var credential: URLCredential? = nil

        do {
            if let (identity, certificate) = try Keychain.getClientIdentityAndCertificate(for: baseUrl.host!) {
                credential = URLCredential(identity: identity,
                                           certificates: [certificate],
                                           persistence: URLCredential.Persistence.permanent)
            } else {
                throw APIClientError.ClientCertificateMissing
            }
        } catch {
            NotificationCenter.default.post(name: Notification.Name(ApiEvents.CLIENT_ERROR.rawValue),
                                            object: nil,
                                            userInfo: ["serverUrl": baseUrl.absoluteString,
                                                       "errorCode": error._code,
                                                       "errorDescription": error.localizedDescription])
        }
        
        return credential
    }
}
