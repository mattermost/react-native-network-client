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

open class LinearRetryPolicy: RetryPolicy {
    public static let defaultRetryInterval: UInt = 2000
    public let retryInterval: UInt
    
    public init(retryLimit: UInt = RetryPolicy.defaultRetryLimit,
                retryInterval: UInt = LinearRetryPolicy.defaultRetryInterval,
                retryableHTTPMethods: Set<HTTPMethod> = RetryPolicy.defaultRetryableHTTPMethods,
                retryableHTTPStatusCodes: Set<Int> = RetryPolicy.defaultRetryableHTTPStatusCodes,
                retryableURLErrorCodes: Set<URLError.Code> = RetryPolicy.defaultRetryableURLErrorCodes) {
        precondition(retryInterval > 0, "The `retryInterval` must be greater than 0.")
        self.retryInterval = retryInterval
        super.init(retryLimit: retryLimit, retryableHTTPMethods: retryableHTTPMethods, retryableHTTPStatusCodes: retryableHTTPStatusCodes, retryableURLErrorCodes: retryableURLErrorCodes)
    }
    
    override open func retry(_ request: Request,
                        for session: Session,
                        dueTo error: Error,
                        completion: @escaping (RetryResult) -> Void) {
        if request.retryCount < retryLimit, shouldRetry(request: request, dueTo: error) {
            completion(.retryWithDelay(Double(retryInterval) / 1000))
        } else {
            completion(.doNotRetry)
        }
    }
}
