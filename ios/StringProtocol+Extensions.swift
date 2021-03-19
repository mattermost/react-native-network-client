//
//  StringProtocol+Extensions.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 3/19/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

extension StringProtocol {
    var firstUppercased: String { return prefix(1).uppercased() + dropFirst() }
}
