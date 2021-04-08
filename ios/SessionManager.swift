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

public class SessionManager: NSObject {

    @objc public static let `default` = SessionManager()
    private override init() {}
    internal var sessions: [URL: Session] = [:]
    
    func sessionCount() -> Int {
        return sessions.count
    }

    func createSession(for baseUrl:URL,
                       withRootQueue rootQueue: DispatchQueue,
                       withDelegate delegate: SessionDelegate,
                       withConfiguration configuration:URLSessionConfiguration = URLSessionConfiguration.af.default,
                       withInterceptor interceptor:Interceptor? = nil,
                       withRedirectHandler redirectHandler:RedirectHandler? = nil,
                       withCancelRequestsOnUnauthorized cancelRequestsOnUnauthorized:Bool = false,
                       withBearerAuthTokenResponseHeader bearerAuthTokenResponseHeader:String? = nil,
                       withClientP12Configuration clientP12Configuration:[String:String]? = nil,
                       withTrustSelfSignedServerCertificate trustSelfSignedServerCertificate:Bool = false) -> Void {
        var session = getSession(for: baseUrl)
        if (session != nil) {
            return
        }

        session = Session(configuration: configuration, delegate: delegate, rootQueue: rootQueue, interceptor: interceptor, redirectHandler: redirectHandler)
        session?.baseUrl = baseUrl
        session?.cancelRequestsOnUnauthorized = cancelRequestsOnUnauthorized
        session?.bearerAuthTokenResponseHeader = bearerAuthTokenResponseHeader
        session?.trustSelfSignedServerCertificate = trustSelfSignedServerCertificate
        if let clientP12Configuration = clientP12Configuration {
            let path = clientP12Configuration["path"]
            let password = clientP12Configuration["password"]
            do {
                try Keychain.importClientP12(withPath: path!, withPassword: password, forHost: baseUrl.host!)
            } catch {
                NotificationCenter.default.post(name: Notification.Name(API_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                                object: nil,
                                                userInfo: ["serverUrl": baseUrl.absoluteString, "errorCode": error._code, "errorDescription": error.localizedDescription])
            }
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
    
    func getSession(for baseUrl:URL) -> Session? {
        return sessions[baseUrl]
    }
    
    func getSession(for urlSession:URLSession) -> Session? {
        guard let session = Array(sessions.values).first(where: {$0.session == urlSession}) else {
            return nil
        }
        
        return session
    }
    
    func getSession(for request:URLRequest) -> Session? {
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
    
    func invalidateSession(for baseUrl:URL, withReset reset:Bool = false) -> Void {
        guard let session = getSession(for: baseUrl) else {
            return
        }
        
        if reset {
            session.session.reset {
                do {
                    try Keychain.deleteAll(for: baseUrl.absoluteString)
                } catch {
                    NotificationCenter.default.post(name: Notification.Name(API_CLIENT_EVENTS["CLIENT_ERROR"]!),
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
