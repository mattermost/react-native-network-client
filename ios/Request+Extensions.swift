//
//  Request+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 4/20/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire

fileprivate var retryPolicy_FILEPRIVATE : [ObjectIdentifier:RetryPolicy] = [:]

extension Request {
    var retryPolicy: RetryPolicy? {
        get { return retryPolicy_FILEPRIVATE[ObjectIdentifier(self)] }
        set { retryPolicy_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }

    func setRetryPolicy(retryPolicy: RetryPolicy) {
        self.retryPolicy = retryPolicy
        
        return self
    }
}
