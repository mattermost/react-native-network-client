import Foundation
import Alamofire
import SwiftyJSON
import os.log

public class SessionManager: NSObject {

    @objc public static let `default` = SessionManager()
    internal var sessions: [URL: Session] = [:]
    
    public func loadCertificates(forDomain domain: String? = nil) -> ServerTrustManager? {
        guard let certsPath = Bundle.main.resourceURL?.appendingPathComponent("certs") else {
            return nil
        }
    
        let fileManager = FileManager.default
        do {
            var certificates: [String: [SecCertificate]] = [:]
            let certsArray = try fileManager.contentsOfDirectory(at: certsPath, includingPropertiesForKeys: nil, options: .skipsHiddenFiles)
            let certs = certsArray.filter{ $0.pathExtension == "crt" || $0.pathExtension == "cer"}
            for cert in certs {
                if let certDomain = URL(string: cert.absoluteString)?.deletingPathExtension().lastPathComponent,
                   certDomain == domain || domain == nil,
                   let certData = try? Data(contentsOf: cert),
                   let certificate = SecCertificateCreateWithData(nil, certData as CFData)
                {
                    if certificates[certDomain] != nil {
                        certificates[certDomain]?.append(certificate)
                    } else {
                        certificates[certDomain] = [certificate]
                    }
                    os_log("Mattermost: loaded certificate %{public}@ for domain %{public}@",
                           log: .default,
                           type: .info,
                           cert.lastPathComponent, certDomain
                    )
                }
            }
            
            if certificates.isEmpty {
                return nil
            }
            
            var evaluators: [String: ServerTrustEvaluating] = [:]
            for domain in certificates {
                evaluators[domain.key] = PinnedCertificatesTrustEvaluator(certificates: domain.value,
                                                                          acceptSelfSignedCertificates: false,
                                                                          performDefaultValidation: true,
                                                                          validateHost: true)
            }

            return ServerTrustManager(allHostsMustBeEvaluated: true, evaluators: evaluators)
        } catch {
            os_log(
                "Mattermost: Error loading pinned certificates -- %{public}@",
                log: .default,
                type: .error,
                String(describing: error)
            )
            return nil
        }
    }
    
    func sessionCount() -> Int {
        return sessions.count
    }
    
    func getAllSessions() -> [URL: Session] {
        return sessions
    }

    func createSession(for baseUrl:URL,
                       withRootQueue rootQueue: DispatchQueue,
                       withDelegate delegate: SessionDelegate,
                       withConfiguration configuration: URLSessionConfiguration = URLSessionConfiguration.af.default,
                       withInterceptor interceptor: Interceptor? = nil,
                       withRedirectHandler redirectHandler: RedirectHandler? = nil,
                       withRetryPolicy retryPolicy: RetryPolicy? = nil,
                       withCancelRequestsOnUnauthorized cancelRequestsOnUnauthorized: Bool = false,
                       withBearerAuthTokenResponseHeader bearerAuthTokenResponseHeader: String? = nil,
                       withClientP12Configuration clientP12Configuration: [String:String]? = nil,
                       withTrustSelfSignedServerCertificate trustSelfSignedServerCertificate: Bool = false,
                       withCollectMetrics collectMetrics: Bool = false) -> Void {
        var session = getSession(for: baseUrl)
        if (session != nil) {
            return
        }

        session = Session(
            configuration: configuration,
            delegate: delegate,
            rootQueue: rootQueue,
            interceptor: interceptor,
            serverTrustManager: loadCertificates(forDomain: baseUrl.host),
            redirectHandler: redirectHandler)
        
        session?.baseUrl = baseUrl
        session?.retryPolicy = retryPolicy
        session?.cancelRequestsOnUnauthorized = cancelRequestsOnUnauthorized
        session?.bearerAuthTokenResponseHeader = bearerAuthTokenResponseHeader
        session?.trustSelfSignedServerCertificate = trustSelfSignedServerCertificate
        session?.collectMetrics = collectMetrics

        if let clientP12Configuration = clientP12Configuration {
            let path = clientP12Configuration["path"]
            let password = clientP12Configuration["password"]
            do {
                try Keychain.importClientP12(withPath: path!, withPassword: password, forHost: baseUrl.host!)
            } catch {
                NotificationCenter.default.post(name: Notification.Name(ApiEvents.CLIENT_ERROR.rawValue),
                                                object: nil,
                                                userInfo: ["serverUrl": baseUrl.absoluteString, "errorCode": error._code, "errorDescription": error.localizedDescription])
            }
        }
        
        sessions[baseUrl] = session
    }

    func getSessionHeaders(for baseUrl: URL) -> [AnyHashable:Any] {
        guard let session = getSession(for: baseUrl), let headers = session.sessionConfiguration.httpAdditionalHeaders else {
            return [:]
        }

        return headers
    }

    func addSessionHeaders(for baseUrl: URL, additionalHeaders: Dictionary<String, String>) -> Void {
        guard let previousSession = getSession(for: baseUrl) else {
            return
        }

        invalidateSession(for: baseUrl)

        let rootQueue = previousSession.rootQueue
        let delegate = previousSession.delegate
        let configuration = previousSession.sessionConfiguration
        let previousHeaders = configuration.httpAdditionalHeaders ?? [:]
        let newHeaders = previousHeaders.merging(additionalHeaders) {(_, new) in new}
        configuration.httpAdditionalHeaders = newHeaders

        createSession(for: baseUrl,
                      withRootQueue: rootQueue,
                      withDelegate: delegate,
                      withConfiguration: configuration,
                      withInterceptor: previousSession.interceptor as? Interceptor,
                      withRedirectHandler: previousSession.redirectHandler,
                      withCancelRequestsOnUnauthorized: previousSession.cancelRequestsOnUnauthorized,
                      withBearerAuthTokenResponseHeader: previousSession.bearerAuthTokenResponseHeader,
                      withTrustSelfSignedServerCertificate: previousSession.trustSelfSignedServerCertificate)
    }
    
    func getSession(for baseUrl: URL) -> Session? {
        return sessions[baseUrl]
    }
    
    func getSession(for urlSession: URLSession) -> Session? {
        guard let session = Array(sessions.values).first(where: {$0.session == urlSession}) else {
            return nil
        }
        
        return session
    }
    
    func getSession(for request: URLRequest) -> Session? {
        if let requestUrl = request.url {
            if let session = getSession(for: requestUrl) {
                return session
            }
            
            let port = requestUrl.port != nil ? ":\(String(requestUrl.port!))" : ""
            guard let scheme = requestUrl.scheme, let host = requestUrl.host, let hostUrl = URL(string: "\(scheme)://\(host)\(port)") else {
                return nil
            }

            var pathComponents = requestUrl.pathComponents
            while (pathComponents.count != 0) {
                var url = hostUrl
                for component in pathComponents {
                    url = url.appendingPathComponent(component)
                }
                if let session = getSession(for: url) {
                    return session
                }
                
                pathComponents.removeLast()
            }
            
            if let session = getSession(for: hostUrl) {
                return session
            }
        }
        
        return nil
    }
    
    func invalidateSession(for baseUrl: URL, withReset reset: Bool = false) -> Void {
        guard let session = getSession(for: baseUrl) else {
            return
        }
        
        if reset {
            session.session.reset {
                do {
                    try Keychain.deleteAll(for: baseUrl.absoluteString)
                    URLCache.shared.removeAllCachedResponses()
                } catch {
                    NotificationCenter.default.post(name: Notification.Name(ApiEvents.CLIENT_ERROR.rawValue),
                                                    object: nil,
                                                    userInfo: ["serverUrl": baseUrl.absoluteString, "errorCode": error._code, "errorDescription": error.localizedDescription])
                }
                session.session.invalidateAndCancel()
                self.sessions.removeValue(forKey: baseUrl)
            }
        } else {
            session.session.invalidateAndCancel()
            self.sessions.removeValue(forKey: baseUrl)
        }
    }
}
