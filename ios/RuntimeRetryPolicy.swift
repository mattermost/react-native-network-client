//
//  RuntimeRetryPolicy.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 4/20/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire

// An interceptor that determines what retry policy, if any, to retry
// the request with at runtime.
open class RuntimeRetrier: RequestInterceptor {
    open func retry(_ request: Request,
                    for session: Session,
                    dueTo error: Error,
                    completion: @escaping (RetryResult) -> Void) {
        if let retryPolicy = request.retryPolicy ?? session.retryPolicy {
            retryPolicy.retry(request,
                              for: session,
                              dueTo: error,
                              completion: completion)
        } else {
            completion(.doNotRetry)
        }
    }
}
