//
//  WebSocket+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 1/19/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Starscream

fileprivate var clientId_FILEPRIVATE : [ObjectIdentifier:String] = [:]
extension WebSocket {
    var clientId: String {
        get { return clientId_FILEPRIVATE[ObjectIdentifier(self)]!}
        set { clientId_FILEPRIVATE[ObjectIdentifier(self)] = newValue}
    }
}
