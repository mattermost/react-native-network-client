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

class SessionManager {

    public static let `default` = SessionManager()
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
                       withBearerAuthTokenResponseHeader bearerAuthTokenResponseHeader:String? = nil) -> Void {
        var session = getSession(for: baseUrl)
        if (session != nil) {
            return
        }

        session = Session(configuration: configuration, interceptor: interceptor, redirectHandler: redirectHandler)
        session?.cancelRequestsOnUnauthorized = cancelRequestsOnUnauthorized
        session?.bearerAuthTokenResponseHeader = bearerAuthTokenResponseHeader

        sessions[baseUrl] = session
    }

    func getSessionHeaders(for baseUrl:URL) -> [AnyHashable : Any]? {
        guard let session = getSession(for: baseUrl) else {
            return [:]
        }

        return session.sessionConfiguration.httpAdditionalHeaders
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
    
    func invalidateSession(for baseUrl:URL) -> Void {
        guard let session = getSession(for: baseUrl) else {
            return
        }
        
        session.session.invalidateAndCancel()
        sessions.removeValue(forKey: baseUrl)
    }
}
