//
//  SessionManager+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 4/7/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

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
            NotificationCenter.default.post(name: Notification.Name(API_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                            object: nil,
                                            userInfo: ["serverUrl": baseUrl.absoluteString,
                                                       "errorCode": error._code,
                                                       "errorDescription": error.localizedDescription])
        }
        
        return credential
    }
}
