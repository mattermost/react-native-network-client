//
//  KeychainWrapper.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 2/22/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

enum CertificateSource: String, CaseIterable {
    case client = "client"
    case server = "server"
}

class Keychain {
    @discardableResult static func setToken(_ token: String, forServerUrl serverUrl: String) -> Bool {
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
    
    @discardableResult static func setClientCertificate(_ certificate: SecCertificate, forServerUrl serverUrl: String) -> Bool {
        guard var attributes = buildCertificateAttributes(for: serverUrl, andSource: .client) else {
            return false
        }
        attributes[kSecValueRef] = certificate
        
        return setCertificate(certificate, withAttributes: attributes as CFDictionary)
    }
    
    static func getServerCertificate(for serverUrl: String) -> SecCertificate? {
        guard var attributes = buildCertificateAttributes(for: serverUrl, andSource: .server) else {
            return nil
        }
        attributes[kSecMatchLimit] = kSecMatchLimitOne
        attributes[kSecReturnData] = kCFBooleanTrue
        
        var result: AnyObject?
        let status = SecItemCopyMatching(attributes as CFDictionary, &result)
        if status == errSecSuccess {
            return result as! SecCertificate?
        }
        
        return nil
    }
    
    @discardableResult static func setServerCertificate(_ certificate: SecCertificate, forServerUrl serverUrl: String) -> Bool {
        guard var attributes = buildCertificateAttributes(for: serverUrl, andSource: .server) else {
            return false
        }
        attributes[kSecValueRef] = certificate
        
        return setCertificate(certificate, withAttributes: attributes as CFDictionary)
    }
    
    static func getServerCertificate(_ certificate: String, forServerUrl serverUrl: String) -> SecCertificate? {
        guard var attributes = buildCertificateAttributes(for: serverUrl, andSource: .server) else {
            return nil
        }
        attributes[kSecMatchLimit] = kSecMatchLimitOne
        attributes[kSecReturnData] = kCFBooleanTrue
        
        var result: AnyObject?
        let status = SecItemCopyMatching(attributes as CFDictionary, &result)
        if status == errSecSuccess {
            return result as! SecCertificate?
        }
        
        return nil
    }
    
    static func deleteAll(for serverUrl: String) -> Void {
        deleteToken(for: serverUrl)
        deleteCertificates(for: serverUrl)
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
    
    private static func setCertificate(_ certificate: SecCertificate, withAttributes attributes: CFDictionary) -> Bool {
        let status: OSStatus = SecItemAdd(attributes as CFDictionary, nil)
        if status == errSecSuccess {
            return true
        } else if status == errSecDuplicateItem {
            return updateCertificate(certificate, withAttributes: attributes)
        }
        
        return false
    }
    
    private static func updateCertificate(_ certificate: SecCertificate, withAttributes attributes: CFDictionary) -> Bool {
        let attributesToUpdate = [kSecValueRef: certificate] as CFDictionary
        let status: OSStatus = SecItemUpdate(attributes, attributesToUpdate)

        return status == errSecSuccess
    }
    
    private static func deleteCertificates(for serverUrl: String) -> Void {
        for source in CertificateSource.allCases {
            guard let attributes = buildCertificateAttributes(for: serverUrl, andSource: source) else {
                break
            }
            
            SecItemDelete(attributes as CFDictionary)
        }
    }
    
    
    private static func buildCertificateAttributes(for serverUrl: String, andSource source: CertificateSource) -> [CFString: Any]? {
        let label = "\(serverUrl)-\(source.rawValue)"
        guard let labelData = label.data(using: .utf8) else {
            return nil
        }
        
        var attributes: [CFString: Any] = [
            kSecClass: kSecClassCertificate,
            kSecAttrLabel: labelData
        ]
        
        if let accessGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as! String? {
            attributes[kSecAttrAccessGroup] = accessGroup
        }
        
        return attributes
    }
}