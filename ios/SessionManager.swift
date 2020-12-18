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

@objc public class SessionManager: NSObject {

    @objc public static let `default` = SessionManager()
    private override init() {}
    internal var sessions: [String: Session] = [:]
    
    func sessionCount() -> Int {
        return sessions.count
    }

    // TODO
    // Configure sesssion:
    //  * ServerTrustManager
    //  * CachedResponseHandler
    //  * EventMonitor(s)
    func createSession(for host:String,
                       withConfiguration configuration:URLSessionConfiguration = URLSessionConfiguration.af.default,
                       withInterceptor interceptor:Interceptor? = nil,
                       withRedirectHandler redirectHandler:RedirectHandler? = nil,
                       withCancelRequestsOnUnauthorized cancelRequestsOnUnauthorized:Bool = false,
                       withBearerAuthTokenResponseHeader bearerAuthTokenResponseHeader:String? = nil) -> Void {
        var session = getSession(for: host)
        if (session != nil) {
            return
        }

        session = Session(configuration: configuration, interceptor: interceptor, redirectHandler: redirectHandler)
        session?.cancelRequestsOnUnauthorized = cancelRequestsOnUnauthorized
        session?.bearerAuthTokenResponseHeader = bearerAuthTokenResponseHeader

        sessions[host] = session
    }

    func getSessionHeaders(for host:String) -> [AnyHashable : Any]? {
        guard let session = getSession(for: host) else {
            return [:]
        }

        return session.sessionConfiguration.httpAdditionalHeaders
    }

    func addSessionHeaders(for host:String, additionalHeaders:Dictionary<String, String>) -> Void {
        guard let previousSession = getSession(for: host) else {
            return
        }

        invalidateSession(for: host)

        let configuration = previousSession.sessionConfiguration
        let previousHeaders = configuration.httpAdditionalHeaders ?? [:]
        let newHeaders = previousHeaders.merging(additionalHeaders) {(_, new) in new}
        configuration.httpAdditionalHeaders = newHeaders

        createSession(for: host,
                      withConfiguration: configuration,
                      withInterceptor: previousSession.interceptor as? Interceptor,
                      withRedirectHandler: previousSession.redirectHandler,
                      withCancelRequestsOnUnauthorized: previousSession.cancelRequestsOnUnauthorized,
                      withBearerAuthTokenResponseHeader: previousSession.bearerAuthTokenResponseHeader)
    }
    
    func getSession(for host:String) -> Session? {
        return sessions[host]
    }
    
    @objc public func getSessionConfiguration(for host:String) -> URLSessionConfiguration? {
        if let session = getSession(for: host) {
            return session.session.configuration
        }
        
        return nil
    }
    
    func invalidateSession(for host:String) -> Void {
        guard let session = getSession(for: host) else {
            return
        }
        
        session.session.invalidateAndCancel()
        sessions.removeValue(forKey: host)
    }
}
