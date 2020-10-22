//
//  RequestInterceptor.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire

protocol AccessTokenStorage: class {
    typealias  JWT = String
    var accessToken: JWT { get set }
}

final class RequestInterceptor: Alamofire.RequestInterceptor {
    private let storage: AccessTokenStorage
    
    init(storage: AccessTokenStorage) {
        self.storage = storage
    }
    
   func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
       var adaptedRequest = urlRequest
    print("ADAPTED REQUEST \(adaptedRequest.headers)")
       guard !storage.accessToken.isEmpty else {
           return completion(.success(adaptedRequest))
       }

       adaptedRequest.setValue("Bearer " + storage.accessToken, forHTTPHeaderField: "Authorization")
       completion(.success(urlRequest))
   }
}
