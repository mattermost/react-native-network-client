//
//  BearerAuthenticationAdapter.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 12/2/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire
import SwiftKeychainWrapper

@objc public class BearerAuthenticationAdapter: NSObject, RequestAdapter {
    @objc public static func addAuthorizationBearerToken(to urlRequest: URLRequest) -> URLRequest {
        var urlRequest = urlRequest
        if let bearerToken = KeychainWrapper.standard.string(forKey: urlRequest.url!.host!) {
            urlRequest.headers.add(.authorization(bearerToken: bearerToken))
        }
        
        return urlRequest
    }

    public func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
        let urlRequest = BearerAuthenticationAdapter.addAuthorizationBearerToken(to: urlRequest)

        completion(.success(urlRequest))
    }
}
