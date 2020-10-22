//
//  TestStorage.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/7/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

final class TestStorage: AccessTokenStorage {
    var accessToken: JWT
    init() {
        self.accessToken = ""
    }
}
