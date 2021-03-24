//
//  Keychain.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 2/22/21.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Foundation

enum KeychainError: Error {
    case CertificateForIdentityNotFound
    case IdentityNotFound
    case InvalidToken(_ token: String)
    case InvalidP12Path(_ path: String)
    case InvalidP12Contents(_ path: String)
    case InvalidServerUrl(_ serverUrl: String)
    case FailedAuthSecPKCS12Import
    case FailedSecIdentityCopyCertificate(_ status: OSStatus)
    case FailedSecItemAdd(_ status: OSStatus)
    case FailedSecItemCopyMatching(_ status: OSStatus)
    case FailedSecItemUpdate(_ status: OSStatus)
    case FailedSecPKCS12Import(_ status: OSStatus)
}

extension KeychainError: LocalizedError {
    var errorCode: Int32? {
        switch self {
        case .CertificateForIdentityNotFound: return -100
        case .IdentityNotFound: return -101
        case .InvalidToken(_): return -102
        case .InvalidP12Path(_): return -103
        case .InvalidP12Contents(_): return -104
        case .InvalidServerUrl(_): return -105
        case .FailedAuthSecPKCS12Import: return -106
        case .FailedSecIdentityCopyCertificate(status: let status): return status
        case .FailedSecItemAdd(status: let status): return status
        case .FailedSecItemCopyMatching(status: let status): return status
        case .FailedSecItemUpdate(status: let status): return status
        case .FailedSecPKCS12Import(status: let status): return status
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .CertificateForIdentityNotFound:
            return "Certificate for idendity not found"
        case .IdentityNotFound:
            return "Identity not found"
        case .InvalidToken(token: let token):
            return "Invalid token: \(token)"
        case .InvalidP12Path(path: let path):
            return "Invalid P12 path: \(path)"
        case .InvalidP12Contents(path: let path):
            return "Invalid P12 file contents: \(path)"
        case .InvalidServerUrl(serverUrl: let serverUrl):
            return "Invalid server URL: \(serverUrl)"
        case .FailedAuthSecPKCS12Import:
            return "Incorrect or missing P12 password"
        case .FailedSecIdentityCopyCertificate(status: let status):
            return "Failed to copy certificate: iOS code \(status)"
        case .FailedSecItemAdd(status: let status):
            return "Failed to add Keychain item: iOS code \(status)"
        case .FailedSecItemCopyMatching(status: let status):
            return "Failed to copy Keychain item: iOS code \(status)"
        case .FailedSecItemUpdate(status: let status):
            return "Failed to update Keychain item: iOS code \(status)"
        case .FailedSecPKCS12Import(status: let status):
            return "Failed to import P12: iOS code \(status)"
        }
    }
}

enum CertificateSource: String, CaseIterable {
    case client = "client"
    case server = "server"
}

class Keychain {
    static func setToken(_ token: String, forServerUrl serverUrl: String) throws {
        guard let tokenData = token.data(using: .utf8) else {
            throw KeychainError.InvalidToken(token)
        }
        
        var attributes = try buildTokenAttributes(for: serverUrl)
        attributes[kSecValueData] = tokenData

        let status: OSStatus = SecItemAdd(attributes as CFDictionary, nil)
        if status == errSecDuplicateItem {
            try updateToken(tokenData, withAttributes: attributes as CFDictionary)
        } else if status != errSecSuccess {
            throw KeychainError.FailedSecItemAdd(status)
        }
    }
    
    static func getToken(for serverUrl: String) throws -> String? {
        var attributes = try buildTokenAttributes(for: serverUrl)
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
    
    static func importClientP12(withPath path:String, withPassword password:String? = nil, forServerUrl serverUrl: String) throws {
        guard let url = URL(string: path) else {
            throw KeychainError.InvalidP12Path(path)
        }
        guard let data = try? Data(contentsOf: url) else {
            throw KeychainError.InvalidP12Contents(path)
        }
        let identity = try identityFromP12Import(data, password)
        let attributes = try buildIdentityAttributes(identity!, for: serverUrl)
        
        if let _ = try? getClientIdentityAndCertificate(for: serverUrl) {
            try deleteClientP12(for: serverUrl)
        }

        var persistentRef: AnyObject?
        let addStatus = SecItemAdd(attributes as CFDictionary, &persistentRef)
        guard addStatus == errSecSuccess else {
            throw KeychainError.FailedSecItemAdd(addStatus)
        }
    }
    
    static func getClientIdentityAndCertificate(for serverUrl: String) throws -> (SecIdentity, SecCertificate)? {
        let query = try buildIdentityQuery(for: serverUrl)

        var result: AnyObject?
        let identityStatus = SecItemCopyMatching(query as CFDictionary, &result)
        guard identityStatus == errSecSuccess else {
            if identityStatus == errSecItemNotFound {
                throw KeychainError.IdentityNotFound
            }

            throw KeychainError.FailedSecItemCopyMatching(identityStatus)
        }
        
        let identity = result as! SecIdentity
        var certificate: SecCertificate?
        let certificateStatus = SecIdentityCopyCertificate(identity, &certificate)
        guard certificateStatus == errSecSuccess else {
            throw KeychainError.FailedSecIdentityCopyCertificate(certificateStatus)
        }
        guard certificate != nil else {
            throw KeychainError.CertificateForIdentityNotFound
        }
        
        return (identity, certificate!)
    }
    
    static func deleteAll(for serverUrl: String) throws {
        try deleteToken(for: serverUrl)
        try deleteClientP12(for: serverUrl)
    }
    
    private static func updateToken(_ tokenData: Data, withAttributes attributes: CFDictionary) throws {
        let attributesToUpdate = [kSecValueData: tokenData] as CFDictionary
        let status: OSStatus = SecItemUpdate(attributes, attributesToUpdate)
        if status != errSecSuccess {
            throw KeychainError.FailedSecItemUpdate(status)
        }
    }
    
    private static func deleteToken(for serverUrl: String) throws {
        let attributes = try buildTokenAttributes(for: serverUrl)
        SecItemDelete(attributes as CFDictionary)
    }
    
    private static func buildTokenAttributes(for serverUrl: String) throws -> [CFString: Any] {
        guard let serverUrlData = serverUrl.data(using: .utf8) else {
            throw KeychainError.InvalidServerUrl(serverUrl)
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
    
    private static func buildIdentityAttributes(_ identity: SecIdentity, for serverUrl: String) throws -> [CFString: Any] {
        guard let serverUrlData = serverUrl.data(using: .utf8) else {
            throw KeychainError.InvalidServerUrl(serverUrl)
        }
        
        var attributes: [CFString:Any] = [
            kSecValueRef: identity,
            kSecAttrLabel: serverUrlData,
            kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        if let accessGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as! String? {
            attributes[kSecAttrAccessGroup] = accessGroup
        }

        return attributes
    }
    
    private static func buildIdentityQuery(for serverUrl: String) throws -> [CFString: Any] {
        guard let serverUrlData = serverUrl.data(using: .utf8) else {
            throw KeychainError.InvalidServerUrl(serverUrl)
        }
        
        let query: [CFString:Any] = [
            kSecClass: kSecClassIdentity,
            kSecAttrLabel: serverUrlData,
            kSecReturnRef: true
        ]

        return query
    }
    
    static func deleteClientP12(for serverUrl: String) throws {
        let query = try buildIdentityQuery(for: serverUrl)
        SecItemDelete(query as CFDictionary)
    }
    
    private static func identityFromP12Import(_ data: Data, _ password: String?) throws -> SecIdentity? {
        var options: [CFString: String] = [:]
        if password != nil {
            options[kSecImportExportPassphrase] = password
        }
        
        var rawItems: CFArray?
        let importStatus = SecPKCS12Import(data as CFData, options as CFDictionary, &rawItems)
        guard importStatus == errSecSuccess else {
            if importStatus == errSecAuthFailed {
                throw KeychainError.FailedAuthSecPKCS12Import
            }

            throw KeychainError.FailedSecPKCS12Import(importStatus)
        }
        
        let items = rawItems! as! Array<Dictionary<String, Any>>
        let firstItem = items[0]
        let identity = firstItem[kSecImportItemIdentity as String] as! SecIdentity?

        return identity
    }
}
