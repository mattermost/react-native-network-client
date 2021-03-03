//
//  URL+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 1/15/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

extension URL {
    func fileSize() throws -> Int {
        return try self.resourceValues(forKeys: [.fileSizeKey]).fileSize!
    }
}
