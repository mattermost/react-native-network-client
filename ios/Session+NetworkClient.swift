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

fileprivate var cancelRequestsOnUnauthorized_FILEPRIVATE : [ObjectIdentifier:Bool] = [:]
extension Session {
    var cancelRequestsOnUnauthorized: Bool {
        get { return cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] ?? false }
        set { cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }
}
