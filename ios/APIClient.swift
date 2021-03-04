//
//  APIClient.swift
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

import Alamofire
import SwiftyJSON
import React

let API_CLIENT_EVENTS = [
    "UPLOAD_PROGRESS": "APIClient-UploadProgress",
    "CLIENT_CERTIFICATE_MISSING": "APIClient-Client-Certificate-Missing",
]

let MISSING_CLIENT_CERT_NOTIF_NAME = Notification.Name(API_CLIENT_EVENTS["CLIENT_CERTIFICATE_MISSING"]!)

class APIClientSessionDelegate: SessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        var credential: URLCredential? = nil
        var disposition: URLSession.AuthChallengeDisposition = .performDefaultHandling

        let authMethod = challenge.protectionSpace.authenticationMethod
        if authMethod == NSURLAuthenticationMethodClientCertificate {
            if let serverUrl = SessionManager.default.getSessionBaseUrlString(for: session) {
                if let (identity, certificate) = Keychain.getClientIdentityAndCertificate(for: serverUrl) {
                    credential = URLCredential(identity: identity, certificates: [certificate], persistence: URLCredential.Persistence.permanent)
                } else {
                    NotificationCenter.default.post(name: MISSING_CLIENT_CERT_NOTIF_NAME, object: nil, userInfo: ["serverUrl": serverUrl])
                }
            }
            disposition = .useCredential
        }

        completionHandler(disposition, credential)
    }
}

@objc(APIClient)
class APIClient: RCTEventEmitter, NetworkClient {
    var emitter: RCTEventEmitter!
    var hasListeners: Bool!
    let requestsTable = NSMapTable<NSString, UploadRequest>.strongToWeakObjects()
    let sessionDelegate: SessionDelegate = APIClientSessionDelegate()
    
    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(self.missingCertificateHandler), name: MISSING_CLIENT_CERT_NOTIF_NAME, object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self, name: MISSING_CLIENT_CERT_NOTIF_NAME, object: nil)
    }

    func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func constantsToExport() -> [AnyHashable : Any]! {
        return ["EVENTS": API_CLIENT_EVENTS, "RETRY_TYPES": RETRY_TYPES]
    }

    open override func supportedEvents() -> [String] {
        return Array(API_CLIENT_EVENTS.values)
    }
    
    override func startObserving() -> Void {
        hasListeners = true;
    }
    
    override func stopObserving() -> Void {
        hasListeners = false;
    }
    
    @objc(createClientFor:withOptions:withResolver:withRejecter:)
    func createClientFor(baseUrlString: String, options: Dictionary<String, Any> = [:], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }

        let options = JSON(options)
        if options != JSON.null {
            let configuration = getURLSessionConfiguration(from: options)
            let redirectHandler = getRedirectHandler(from: options)
            let interceptor = getInterceptor(from: options)
            let cancelRequestsOnUnauthorized = options["sessionConfiguration"]["cancelRequestsOnUnauthorized"].boolValue
            let bearerAuthTokenResponseHeader = options["requestAdapterConfiguration"]["bearerAuthTokenResponseHeader"].string
            let clientP12Configuration = options["clientP12Configuration"].dictionaryObject as? [String:String]

            resolve(
                SessionManager.default.createSession(for: baseUrl,
                                                     withDelegate: sessionDelegate,
                                                     withConfiguration: configuration,
                                                     withInterceptor: interceptor,
                                                     withRedirectHandler: redirectHandler,
                                                     withCancelRequestsOnUnauthorized: cancelRequestsOnUnauthorized,
                                                     withBearerAuthTokenResponseHeader: bearerAuthTokenResponseHeader,
                                                     withClientP12Configuration: clientP12Configuration)
            )

            return
        }
        

        resolve(SessionManager.default.createSession(for: baseUrl, withDelegate: sessionDelegate))
    }

    @objc(invalidateClientFor:withResolver:withRejecter:)
    func invalidateClientFor(baseUrlString: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }

        resolve(SessionManager.default.invalidateSession(for: baseUrl, withReset: true))
    }

    @objc(addClientHeadersFor:withHeaders:withResolver:withRejecter:)
    func addClientHeadersFor(baseUrlString: String, headers: Dictionary<String, String>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }

        if SessionManager.default.getSession(for: baseUrl) == nil {
            rejectInvalidSession(for: baseUrl, withRejecter: reject)
            return
        }

        resolve(SessionManager.default.addSessionHeaders(for: baseUrl, additionalHeaders: headers))
    }

    @objc(getClientHeadersFor:withResolver:withRejecter:)
    func getClientHeadersFor(baseUrlString: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }

        if SessionManager.default.getSession(for: baseUrl) == nil {
            rejectInvalidSession(for: baseUrl, withRejecter: reject)
            return
        }

        let headers = JSON(SessionManager.default.getSessionHeaders(for: baseUrl)).dictionaryObject
        resolve(headers)
    }
    
    @objc(importClientP12For:withPath:withPassword:withResolver:withRejecter:)
    func importClientP12For(baseUrlString: String, path: String, password: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }
    
        guard let session = SessionManager.default.getSession(for: baseUrl) else {
            rejectInvalidSession(for: baseUrl, withRejecter: reject)
            return
        }

        resolve(Keychain.importClientP12(withPath: path, withPassword: password, forServerUrl: session.baseUrl.absoluteString))
    }
    
    @objc(get:forEndpoint:withOptions:withResolver:withRejecter:)
    func get(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: baseUrl, withEndpoint: endpoint, withMethod: .get, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }

    @objc(put:forEndpoint:withOptions:withResolver:withRejecter:)
    func put(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: baseUrl, withEndpoint: endpoint, withMethod: .put, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc(post:forEndpoint:withOptions:withResolver:withRejecter:)
    func post(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: baseUrl, withEndpoint: endpoint, withMethod: .post, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }

    @objc(patch:forEndpoint:withOptions:withResolver:withRejecter:)
    func patch(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: baseUrl, withEndpoint: endpoint, withMethod: .patch, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }

    @objc(delete:forEndpoint:withOptions:withResolver:withRejecter:)
    func delete(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: baseUrl, withEndpoint: endpoint, withMethod: .delete, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }

    @objc(upload:forEndpoint:withFileUrl:withTaskId:withOptions:withResolver:withRejecter:)
    func upload(baseUrlString: String, endpoint: String, fileUrlString: String, taskId: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }

        guard let fileUrl = URL(string: fileUrlString) else {
            rejectMalformed(url: fileUrlString, withRejecter: reject)
            return
        }

        guard let session = SessionManager.default.getSession(for: baseUrl) else {
            rejectInvalidSession(for: baseUrl, withRejecter: reject)
            return
        }

        let url = baseUrl.appendingPathComponent(endpoint)
        upload(fileUrl, to: url, forSession: session, withTaskId: taskId, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    func upload(_ fileUrl: URL, to url: URL, forSession session: Session, withTaskId taskId: String, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let fileSize = try? Double(fileUrl.fileSize()) else {
            rejectFileSize(for: fileUrl, withRejecter: reject)
            return
        }

        let headers = getHTTPHeaders(from: options)
        let interceptor = getInterceptor(from: options)
        let requestModifer = getRequestModifier(from: options)
        
        var initialFractionCompleted: Double = 0;
        let stream = InputStream(url: fileUrl)!
        if let skipBytes = options["skipBytes"].uInt64 {
            stream.setProperty(skipBytes, forKey: .fileCurrentOffsetKey)
            initialFractionCompleted = Double(skipBytes) / fileSize
        }

        let request = session.upload(stream, to: url, headers: headers, interceptor: interceptor, requestModifier: requestModifer)
            .uploadProgress { progress in
                if (self.hasListeners) {
                    let fractionCompleted = initialFractionCompleted + (Double(progress.completedUnitCount) / fileSize)
                    self.sendEvent(withName: API_CLIENT_EVENTS["UPLOAD_PROGRESS"], body: ["taskId": taskId, "fractionCompleted": fractionCompleted])
                }
            }
            .responseJSON { json in
                switch (json.result) {
                case .success:
                    resolve([
                        "ok": true,
                        "headers": json.response?.allHeaderFields,
                        "data": json.value,
                        "code": json.response?.statusCode,
                        "lastRequestedUrl": json.response?.url?.absoluteString
                    ])
                case .failure(let error):
                    print("ERROR: \(error)")
                    if (error.responseCode != nil) {
                        resolve([
                            "ok": false,
                            "headers": nil,
                            "data": nil,
                            "code": error.responseCode,
                            "lastRequestedUrl": nil
                        ])

                        return
                    }

                    reject("\(error.responseCode)", error.errorDescription, error)
                }
            }

        self.requestsTable.setObject(request, forKey: taskId as NSString)
    }
    
    @objc(cancelRequest:withResolver:withRejecter:)
    func cancelRequest(_ taskId: String, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let request = self.requestsTable.object(forKey: taskId as NSString) {
            request.cancel()
        }
    }
    
    func handleRequest(for baseUrlString: String, withEndpoint endpoint: String, withMethod method: HTTPMethod, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }
    
        guard let session = SessionManager.default.getSession(for: baseUrl) else {
            rejectInvalidSession(for: baseUrl, withRejecter: reject)
            return
        }

        let url = baseUrl.appendingPathComponent(endpoint)
        handleRequest(for: url, withMethod: method, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Any>) -> Void {
        if data.response?.statusCode == 401 && session.cancelRequestsOnUnauthorized {
            session.cancelAllRequests()
        } else if let tokenHeader = session.bearerAuthTokenResponseHeader {
            if let token = data.response?.allHeaderFields[tokenHeader] as? String {
                Keychain.setToken(token, forServerUrl: session.baseUrl.absoluteString)
            }
        }
    }
    
    func getURLSessionConfiguration(from options: JSON) -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default
        
        if let headers = options["headers"].dictionaryObject {
            config.httpAdditionalHeaders = headers
        }
        
        let sessionOptions = options["sessionConfiguration"]
        if sessionOptions["allowsCellularAccess"].exists() {
            config.allowsCellularAccess = sessionOptions["allowsCellularAccess"].boolValue
        }

        if sessionOptions["timeoutIntervalForRequest"].exists() {
            config.timeoutIntervalForRequest = sessionOptions["timeoutIntervalForRequest"].doubleValue
        }

        if sessionOptions["timeoutIntervalForResource"].exists() {
            config.timeoutIntervalForResource = sessionOptions["timeoutIntervalForResource"].doubleValue
        }

        if sessionOptions["httpMaximumConnectionsPerHost"].exists() {
            config.httpMaximumConnectionsPerHost = sessionOptions["httpMaximumConnectionsPerHost"].intValue
        }
        
        if #available(iOS 11.0, *) {
            if sessionOptions["waitsForConnectivity"].exists() {
                config.waitsForConnectivity = sessionOptions["waitsForConnectivity"].boolValue
            }
        }

        return config
    }

    func getRedirectHandler(from options: JSON) -> RedirectHandler? {
        if options["followRedirects"].exists() {
            return Redirector(behavior: options["followRedirects"].boolValue ? .follow : .doNotFollow)
        }

        return nil
    }
    
    func rejectInvalidSession(for baseUrl: URL, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let message = "Session for \(baseUrl.absoluteString) has been invalidated"
        let error = NSError(domain: "com.mattermost.react-native-network-client", code: NSCoderValueNotFoundError, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
    
    func rejectFileSize(for fileUrl: URL, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let message = "Unable to read file size for \(fileUrl.absoluteString)"
        let error = NSError(domain: "com.mattermost.react-native-network-client", code: NSCoderValueNotFoundError, userInfo: [NSLocalizedDescriptionKey: message])
        reject("\(error.code)", message, error)
    }
    
    @objc(missingCertificateHandler:)
    func missingCertificateHandler(notification: Notification) {
        self.sendEvent(withName: API_CLIENT_EVENTS["CLIENT_CERTIFICATE_MISSING"], body: ["serverUrl": notification.userInfo!["serverUrl"]])
    }
}
