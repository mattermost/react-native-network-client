//
//  SessionManager.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 9/10/20.
//  Copyright © 2020 Facebook. All rights reserved.
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
    //  * RequestInterceptor
    //  * ServerTrustManager
    //  * RedirectHandler
    //  * CachedResponseHandler
    //  * EventMonitor(s)
    func createSession(for rootUrl:String, withConfig config:URLSessionConfiguration = URLSessionConfiguration.af.default) -> Void {
        var session = getSession(for: rootUrl)
        if (session != nil) {
            return
        }
    
        let storage = TestStorage()
        let requestInterceptor = RequestInterceptor(storage: storage)
        session = Session(configuration: config, interceptor: requestInterceptor)
        sessions[rootUrl] = session
    }
    
    func getSession(for rootUrl:String) -> Session? {
        return sessions[rootUrl]
    }
    
    func closeSession(for rootUrl:String) -> Void {
        guard let session = getSession(for: rootUrl) else {
            return
        }
        
        session.session.invalidateAndCancel()
        sessions.removeValue(forKey: rootUrl)
    }
}
