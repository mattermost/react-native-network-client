//
//  KeychainWrapper.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 2/22/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

class Keychain {
    static func setToken(_ token: String, forServerUrl serverUrl: String) -> Bool {
        guard let tokenData = token.data(using: .utf8), var attributes = buildTokenAttributes(for: serverUrl) else {
            return false
        }

        attributes[kSecValueData] = tokenData
        let status: OSStatus = SecItemAdd(attributes as CFDictionary, nil)
        if status == errSecSuccess {
            return true
        } else if status == errSecDuplicateItem {
            return updateToken(tokenData, withAttributes: attributes as CFDictionary)
        }
        
        return false
    }
    
    static func getToken(for serverUrl: String) -> String? {
        guard var attributes = buildTokenAttributes(for: serverUrl) else {
            return nil
        }
        attributes[kSecMatchLimit] = kSecMatchLimitOne
        attributes[kSecReturnData] = kCFBooleanTrue
        
        var result: AnyObject?
        let status = SecItemCopyMatching(attributes as CFDictionary, &result)
        let data = result as? Data
        if status == errSecSuccess && data != nil {
            return String(data: data!, encoding: .utf8)
        }
        
        return nil
    }
    
    static func deleteAll(for serverUrl: String) -> Void {
        deleteToken(for: serverUrl)
    }
    
    private static func updateToken(_ tokenData: Data, withAttributes attributes: CFDictionary) -> Bool {
        let attributesToUpdate = [kSecValueData: tokenData] as CFDictionary
        let status: OSStatus = SecItemUpdate(attributes, attributesToUpdate)

        return status == errSecSuccess
    }
    
    private static func deleteToken(for serverUrl: String) -> Void {
        guard let attributes = buildTokenAttributes(for: serverUrl) else {
            return
        }
        
        SecItemDelete(attributes as CFDictionary)
    }
    
    private static func buildTokenAttributes(for serverUrl: String) -> [CFString: Any]? {
        guard let serverUrlData = serverUrl.data(using: .utf8) else {
            return nil
        }
        
        var attributes: [CFString: Any] = [
            kSecClass: kSecClassInternetPassword,
            kSecAttrLabel: "token",
            kSecAttrServer: serverUrlData,
            kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        if let accessGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as! String? {
            attributes[kSecAttrAccessGroup] = accessGroup
        }
        
        return attributes
    }
}
