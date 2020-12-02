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

final class BearerAuthenticationAdapter: RequestAdapter {
    func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
        var urlRequest = urlRequest
        if let bearerToken = KeychainWrapper.standard.string(forKey: urlRequest.url!.host!) {
            urlRequest.headers.add(.authorization(bearerToken: bearerToken))
        }

        completion(.success(urlRequest))
    }
}
