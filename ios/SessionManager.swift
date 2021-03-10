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
                       withDelegate delegate: SessionDelegate,
                       withConfiguration configuration:URLSessionConfiguration = URLSessionConfiguration.af.default,
                       withInterceptor interceptor:Interceptor? = nil,
                       withRedirectHandler redirectHandler:RedirectHandler? = nil,
                       withCancelRequestsOnUnauthorized cancelRequestsOnUnauthorized:Bool = false,
                       withBearerAuthTokenResponseHeader bearerAuthTokenResponseHeader:String? = nil,
                       withClientP12Configuration clientP12Configuration:[String:String]? = nil) -> Void {
        var session = getSession(for: baseUrl)
        if (session != nil) {
            return
        }

        session = Session(configuration: configuration, delegate: delegate, interceptor: interceptor, redirectHandler: redirectHandler)
        session?.baseUrl = baseUrl
        session?.cancelRequestsOnUnauthorized = cancelRequestsOnUnauthorized
        session?.bearerAuthTokenResponseHeader = bearerAuthTokenResponseHeader
        if let clientP12Configuration = clientP12Configuration {
            let path = clientP12Configuration["path"]
            let password = clientP12Configuration["password"]
            Keychain.importClientP12(withPath: path!, withPassword: password, forServerUrl: session!.baseUrl.absoluteString)
        }
        
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

        let delegate = previousSession.delegate
        let configuration = previousSession.sessionConfiguration
        let previousHeaders = configuration.httpAdditionalHeaders ?? [:]
        let newHeaders = previousHeaders.merging(additionalHeaders) {(_, new) in new}
        configuration.httpAdditionalHeaders = newHeaders

        createSession(for: baseUrl,
                      withDelegate: delegate,
                      withConfiguration: configuration,
                      withInterceptor: previousSession.interceptor as? Interceptor,
                      withRedirectHandler: previousSession.redirectHandler,
                      withCancelRequestsOnUnauthorized: previousSession.cancelRequestsOnUnauthorized,
                      withBearerAuthTokenResponseHeader: previousSession.bearerAuthTokenResponseHeader)
    }
    
    func getSession(for baseUrlString:String) -> Session? {
        if let baseUrl = URL(string: baseUrlString) {
            return getSession(for: baseUrl)
        }
        
        return nil
    }
    
    func getSession(for baseUrl:URL) -> Session? {
        return sessions[baseUrl]
    }
    
    func getSessionBaseUrlString(for urlSession:URLSession) -> String? {
        guard let session = Array(sessions.values).first(where: {$0.session == urlSession}) else {
            return nil
        }
        
        return session.baseUrl.absoluteString
    }
    
    @objc public func getSessionBaseUrlString(for request:URLRequest) -> String? {
        if let requestUrl = request.url {
            if let session = getSession(for: requestUrl) {
                return session.baseUrl.absoluteString
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
}
