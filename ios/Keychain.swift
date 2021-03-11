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
    
    @discardableResult static func importClientP12(withPath path:String, withPassword password:String? = nil, forServerUrl serverUrl: String) -> Bool {
        guard let url = URL(string: path) else {
            // TODO: Alert user of invalid p12 path
            return false
        }
        guard let data = try? Data(contentsOf: url) else {
            // TODO: Alert user of invalid p12 file contents
            return false
        }
        guard let identity = identityFromP12Import(data, password) else {
            // TODO: Alert user of import error
            return false
        }
        guard let attributes = buildIdentityAttributes(identity, for: serverUrl) else {
            // TODO: Alert user of invalid server URL
            return false
        }
        
        if let _ = getClientIdentityAndCertificate(for: serverUrl) {
            deleteClientP12(for: serverUrl)
        }

        var persistentRef: AnyObject?
        let addStatus = SecItemAdd(attributes as CFDictionary, &persistentRef)
        guard addStatus == errSecSuccess else {
            // TODO: Alert user of error adding p12
            return false
        }

        return true
    }
    
    static func getClientIdentityAndCertificate(for serverUrl: String) -> (SecIdentity, SecCertificate)? {
        guard let query = buildIdentityQuery(for: serverUrl) else {
            return nil
        }

        var result: AnyObject?
        let identityStatus = SecItemCopyMatching(query as CFDictionary, &result)
        guard identityStatus == errSecSuccess else {
            if identityStatus == errSecItemNotFound {
                // TODO: Alert user item not found for server
            } else {
                // TODO: Alert user error
            }

            return nil
        }
        
        let identity = result as! SecIdentity
        var certificate: SecCertificate?
        let certificateStatus = SecIdentityCopyCertificate(identity, &certificate)
        guard certificateStatus == errSecSuccess else {
            // TODO: Alert user error copying certificate for identity
            return nil
        }
        guard certificate != nil else {
            // TODO: Alert user of no certificate associated with identity
            return nil
        }
        
        return (identity, certificate!)
    }
    
    static func deleteAll(for serverUrl: String) -> Void {
        deleteToken(for: serverUrl)
        deleteClientP12(for: serverUrl)
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
    
    private static func buildIdentityAttributes(_ identity: SecIdentity, for serverUrl: String) -> [CFString: Any]? {
        guard let serverUrlData = serverUrl.data(using: .utf8) else {
            return nil
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
    
    private static func buildIdentityQuery(for serverUrl: String) -> [CFString: Any]? {
        guard let serverUrlData = serverUrl.data(using: .utf8) else {
            return nil
        }
        
        let query: [CFString:Any] = [
            kSecClass: kSecClassIdentity,
            kSecAttrLabel: serverUrlData,
            kSecReturnRef: true
        ]

        return query
    }
    
    private static func deleteClientP12(for serverUrl: String) -> Void {
        guard let query = buildIdentityQuery(for: serverUrl) else {
            return
        }

        SecItemDelete(query as CFDictionary)
    }
    
    private static func identityFromP12Import(_ data: Data, _ password: String?) -> SecIdentity? {
        var options: [CFString: String] = [:]
        if password != nil {
            options[kSecImportExportPassphrase] = password
        }
        
        var rawItems: CFArray?
        let importStatus = SecPKCS12Import(data as CFData, options as CFDictionary, &rawItems)
        guard importStatus == errSecSuccess else {
            if importStatus == errSecAuthFailed {
                // TODO: return auth error
                return nil
            }

            // TODO: return error
            return nil
        }
        
        let items = rawItems! as! Array<Dictionary<String, Any>>
        let firstItem = items[0]
        let identity = firstItem[kSecImportItemIdentity as String] as! SecIdentity?

        return identity
    }
}
