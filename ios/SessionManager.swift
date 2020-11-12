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

extension Session: Equatable {
    static public func == (lhs: Session, rhs: Session) -> Bool {
        return lhs.session == rhs.session
    }
}

class SessionManager {

    public static let `default` = SessionManager()
    internal var sessions: [String: Session] = [:]
    
    func sessionCount() -> Int {
        return sessions.count
    }

    // TODO
    // Configure sesssion:
    //  * RequestInterceptor?
    //  * ServerTrustManager
    //  * CachedResponseHandler
    //  * EventMonitor(s)
    func createSession(for baseUrl:String, withConfiguration configuration:URLSessionConfiguration = URLSessionConfiguration.af.default, withRedirectHandler redirectHandler:RedirectHandler? = nil) -> Void {
        var session = getSession(for: baseUrl)
        if (session != nil) {
            return
        }
    
        session = Session(configuration: configuration, redirectHandler: redirectHandler)
        sessions[baseUrl] = session
    }

    func getSessionHeaders(for baseUrl:String) -> [AnyHashable : Any]? {
        guard let session = getSession(for: baseUrl) else {
            return [:]
        }

        return session.sessionConfiguration.httpAdditionalHeaders
    }

    func addSessionHeaders(for baseUrl:String, additionalHeaders:Dictionary<String, String>) -> Void {
        guard let prevSession = getSession(for: baseUrl) else {
            return
        }

        invalidateSession(for: baseUrl)

        let config = prevSession.sessionConfiguration
        let previousHeaders = config.httpAdditionalHeaders ?? [:]
        let newHeaders = previousHeaders.merging(additionalHeaders) {(_, new) in new}
        config.httpAdditionalHeaders = newHeaders

        let newSession = Session(configuration: config, interceptor: prevSession.interceptor)
        sessions[baseUrl] = newSession
    }
    
    func getSession(for baseUrl:String) -> Session? {
        return sessions[baseUrl]
    }
    
    func invalidateSession(for baseUrl:String) -> Void {
        guard let session = getSession(for: baseUrl) else {
            return
        }
        
        session.session.invalidateAndCancel()
        sessions.removeValue(forKey: baseUrl)
    }
}
