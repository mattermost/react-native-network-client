//
//  LinearRetryPolicy.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 3/10/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire



open class ExponentialRetryPolicy: RetryPolicy {
    override open func retry(_ request: Request,
                             for session: Session,
                             dueTo error: Error,
                             completion: @escaping (RetryResult) -> Void) {
        if shouldRetry(request: request, dueTo: error) {
            if request.retryCount < retryLimit {
                completion(.retryWithDelay(pow(Double(exponentialBackoffBase), Double(request.retryCount)) * exponentialBackoffScale))
            } else {
                let retryError = NetworkClientError.retry(type: .retriesExhausted)
                completion(.doNotRetryWithError(retryError))
            }
        } else {
            completion(.doNotRetry)
        }
    }
}
