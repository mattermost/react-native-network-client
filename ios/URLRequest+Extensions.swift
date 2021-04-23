//
//  URLRequest+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 4/23/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation
import Alamofire

fileprivate var retryPolicy_FILEPRIVATE : [Int:RetryPolicy] = [:]

extension URLRequest {
    var retryPolicy: RetryPolicy? {
        get { return retryPolicy_FILEPRIVATE[self.hashValue] }
        set { retryPolicy_FILEPRIVATE[self.hashValue] = newValue }
    }
    
    func removeRetryPolicy() {
        retryPolicy_FILEPRIVATE.removeValue(forKey: self.hashValue)
    }
}
