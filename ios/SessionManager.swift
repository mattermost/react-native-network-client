//
//  SessionManager.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 9/10/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire
import SwiftyJSON

@objc public class SessionManager: NSObject {

    @objc public static let `default` = SessionManager()
    private override init() {}
    internal var sessions: [URL: Session] = [:]
    
    func sessionCount() -> Int {
        return sessions.count
    }

    // TODO
    // Configure sesssion:
    //  * ServerTrustManager
    //  * CachedResponseHandler
    //  * EventMonitor(s)
    func createSession(for baseUrl:URL,
                       withConfiguration configuration:URLSessionConfiguration = URLSessionConfiguration.af.default,
                       withInterceptor interceptor:Interceptor? = nil,
                       withRedirectHandler redirectHandler:RedirectHandler? = nil,
                       withCancelRequestsOnUnauthorized cancelRequestsOnUnauthorized:Bool = false,
                       withBearerAuthTokenResponseHeader bearerAuthTokenResponseHeader:String? = nil,
                       withCertificateConfiguration certificateConfiguration:[String:JSON] = [:]) -> Void {
        var session = getSession(for: baseUrl)
        if (session != nil) {
            return
        }

        session = Session(configuration: configuration, interceptor: interceptor, redirectHandler: redirectHandler)
        session?.baseUrl = baseUrl
        session?.cancelRequestsOnUnauthorized = cancelRequestsOnUnauthorized
        session?.bearerAuthTokenResponseHeader = bearerAuthTokenResponseHeader
        handleCertificates(for: session, withConfiguration: certificateConfiguration)

        sessions[baseUrl] = session
    }

    func getSessionHeaders(for baseUrl:URL) -> [AnyHashable : Any] {
        guard let session = getSession(for: baseUrl), let headers = session.sessionConfiguration.httpAdditionalHeaders else {
            return [:]
        }

        return headers
    }

    func addSessionHeaders(for baseUrl:URL, additionalHeaders:Dictionary<String, String>) -> Void {
        guard let previousSession = getSession(for: baseUrl) else {
            return
        }

        invalidateSession(for: baseUrl)

        let configuration = previousSession.sessionConfiguration
        let previousHeaders = configuration.httpAdditionalHeaders ?? [:]
        let newHeaders = previousHeaders.merging(additionalHeaders) {(_, new) in new}
        configuration.httpAdditionalHeaders = newHeaders

        createSession(for: baseUrl,
                      withConfiguration: configuration,
                      withInterceptor: previousSession.interceptor as? Interceptor,
                      withRedirectHandler: previousSession.redirectHandler,
                      withCancelRequestsOnUnauthorized: previousSession.cancelRequestsOnUnauthorized,
                      withBearerAuthTokenResponseHeader: previousSession.bearerAuthTokenResponseHeader)
    }
    
    func getSession(for baseUrl:URL) -> Session? {
        return sessions[baseUrl]
    }
    
    @objc public func getSessionBaseUrlString(for request:URLRequest) -> String? {
        if let requestUrl = request.url {
            if let session = getSession(for: requestUrl) {
                return session.baseUrl.absoluteString
            }
            
            guard let scheme = requestUrl.scheme, let host = requestUrl.host, let hostUrl = URL(string: "\(scheme)://\(host)") else {
                return nil
            }

            var pathComponents = requestUrl.pathComponents
            while (pathComponents.count != 0) {
                var url = hostUrl
                for component in pathComponents {
                    url = url.appendingPathComponent(component)
                }
                if let session = getSession(for: url) {
                    return session.baseUrl.absoluteString
                }
                
                pathComponents.removeLast()
            }
            
            if let session = getSession(for: hostUrl) {
                return session.baseUrl.absoluteString
            }
        }
        
        return nil
    }
    
    @objc public func getSessionConfiguration(for baseUrlString:String) -> URLSessionConfiguration? {
        if let baseUrl = URL(string: baseUrlString), let session = getSession(for: baseUrl) {
            return session.session.configuration
        }
        
        return nil
    }
    
    func invalidateSession(for baseUrl:URL, withReset reset:Bool = false) -> Void {
        guard let session = getSession(for: baseUrl) else {
            return
        }
        
        if reset {
            session.session.reset {
                Keychain.deleteAll(for: baseUrl.absoluteString)
                session.session.invalidateAndCancel()
                self.sessions.removeValue(forKey: baseUrl)
            }
        } else {
            session.session.invalidateAndCancel()
            self.sessions.removeValue(forKey: baseUrl)
        }
    }
    
    private func handleCertificates(for session: Session?, withConfiguration configuration: [String:JSON]) {
        if session == nil {
            return
        }
        
        if let path = configuration["clientCertificatePath"]?.string {
            if let file = FileHandle(forReadingAtPath: path) {
                let data = file.readDataToEndOfFile()
                file.closeFile()
                if let certificate = SecCertificateCreateWithData(nil, data as CFData) {
                    Keychain.setClientCertificate(certificate, forServerUrl: session!.baseUrl.absoluteString)
                }
            } else {
                // TODO certificate error
            }
            
        }

        if let path = configuration["serverCertificatePath"]?.string {
            if let file = FileHandle(forReadingAtPath: path) {
                let data = file.readDataToEndOfFile()
                file.closeFile()
                if let certificate = SecCertificateCreateWithData(nil, data as CFData) {
                    Keychain.setServerCertificate(certificate, forServerUrl: session!.baseUrl.absoluteString)
                    
                    if let pinServerCertificate = configuration["pinServerCertificate"]?.bool {
                        
                    }
                }
            } else {
                // TODO certificate error
            }
        }
    }
}
