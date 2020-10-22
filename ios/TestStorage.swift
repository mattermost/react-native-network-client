//
//  TestStorage.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/7/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

final class TestStorage: AccessTokenStorage {
    var accessToken: JWT
    init() {
        self.accessToken = ""
    }
}
