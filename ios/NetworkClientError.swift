//
//  NetworkClientError.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 3/10/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

enum NetworkClientError: Error {
    case retry(type: Enums.RetryError)
    
    class Enums {}
}

extension Error {
    var asNetworkClientError: NetworkClientError? {
        self as? NetworkClientError
    }
}

extension NetworkClientError: LocalizedError {
    var errorDescription: String? {
        switch self {
            case .retry(let type): return type.localizedDescription
        }
    }
    
    var errorCode: Int? {
        switch self {
            case .retry(let type): return type.errorCode
        }
    }
}

// MARK: - Retry Errors

extension NetworkClientError.Enums {
    enum RetryError {
        case retriesExhausted
    }
}

extension NetworkClientError.Enums.RetryError: LocalizedError {
    var errorDescription: String? {
        switch self {
            case .retriesExhausted: return "Retries exhausted"
        }
    }

    var errorCode: Int? {
        switch self {
            case .retriesExhausted: return -300
        }
    }
}

// MARK: - Booleans

extension NetworkClientError {
    var isRetryExhaustedError: Bool {
        if case .retry(.retriesExhausted) = self { return true }
        return false
    }
}

