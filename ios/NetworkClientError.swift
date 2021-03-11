//
//  NetworkClientError.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 3/10/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

public enum NetworkClientError: Error {
    case retry(type: Enums.RetryError)
    
    public class Enums {}
}

extension Error {
    /// Returns the instance cast as an `AFError`.
    public var asNetworkClientError: NetworkClientError? {
        self as? NetworkClientError
    }
}

extension NetworkClientError: LocalizedError {
    public var errorDescription: String? {
        switch self {
            case .retry(let type): return type.localizedDescription
        }
    }
}

// MARK: - Retry Errors

extension NetworkClientError.Enums {
    public enum RetryError {
        case retriesExhausted
    }
}

extension NetworkClientError.Enums.RetryError: LocalizedError {
    public var errorDescription: String? {
        switch self {
            case .retriesExhausted: return "Retries exhausted"
        }
    }

    public var errorCode: Int? {
        switch self {
            case .retriesExhausted: return nil
        }
    }
}

// MARK: - Booleans

extension NetworkClientError {
    public var isRetryExhaustedError: Bool {
        if case .retry(.retriesExhausted) = self { return true }
        return false
    }
}

