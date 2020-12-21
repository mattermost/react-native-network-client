//
//  Session+NetworkClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 11/18/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire

extension Session: Equatable {
    static public func == (lhs: Session, rhs: Session) -> Bool {
        return lhs.session == rhs.session
    }
}

fileprivate var baseUrl_FILEPRIVATE : [ObjectIdentifier:URL] = [:]
fileprivate var cancelRequestsOnUnauthorized_FILEPRIVATE : [ObjectIdentifier:Bool] = [:]
fileprivate var bearerAuthTokenResponseHeader_FILEPRIVATE : [ObjectIdentifier:String] = [:]
extension Session {
    var baseUrl: URL {
        get { return baseUrl_FILEPRIVATE[ObjectIdentifier(self)]!}
        set { baseUrl_FILEPRIVATE[ObjectIdentifier(self)] = newValue}
    }

    var cancelRequestsOnUnauthorized: Bool {
        get { return cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] ?? false }
        set { cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }

    var bearerAuthTokenResponseHeader: String? {
        get { return bearerAuthTokenResponseHeader_FILEPRIVATE[ObjectIdentifier(self)] }
        set { bearerAuthTokenResponseHeader_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }
}
