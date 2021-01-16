//
//  URL+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 1/15/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

extension URL {
    func fileSize() throws -> Int {
        return try self.resourceValues(forKeys: [.fileSizeKey]).fileSize!
    }
}
