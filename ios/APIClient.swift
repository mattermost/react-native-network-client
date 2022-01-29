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

enum APIClientError: Error {
    case ClientCertificateMissing
}

extension APIClientError: LocalizedError {
    var errorCode: Int {
        switch self {
        case .ClientCertificateMissing: return -200
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .ClientCertificateMissing:
            return "Failed to authenticate: missing client certificate"
        }
    }
}

let API_CLIENT_EVENTS = [
    "UPLOAD_PROGRESS": "APIClient-UploadProgress",
    "DOWNLOAD_PROGRESS": "APIClient-DownloadProgress",
    "CLIENT_ERROR": "APIClient-Error"
]

class APIClientSessionDelegate: SessionDelegate {
    override open func urlSession(_ urlSession: URLSession,
                                  task: URLSessionTask,
                                  didReceive challenge: URLAuthenticationChallenge,
                                  completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        var credential: URLCredential? = nil
        var disposition: URLSession.AuthChallengeDisposition = .performDefaultHandling

        let authMethod = challenge.protectionSpace.authenticationMethod
        if authMethod == NSURLAuthenticationMethodServerTrust {
            if let session = SessionManager.default.getSession(for: urlSession) {
                if session.trustSelfSignedServerCertificate {
                    credential = URLCredential(trust: challenge.protectionSpace.serverTrust!)
                    disposition = .useCredential
                }
            }
        } else if authMethod == NSURLAuthenticationMethodClientCertificate {
            if let session = SessionManager.default.getSession(for: urlSession) {
                credential = SessionManager.default.getCredential(for: session.baseUrl)
            }
            disposition = .useCredential
        }

        completionHandler(disposition, credential)
    }
}

@objc(APIClient)
class APIClient: RCTEventEmitter, NetworkClient {
    var emitter: RCTEventEmitter!
    var hasListeners: Bool = false
    let requestsTable = NSMapTable<NSString, Request>.strongToWeakObjects()
    
    override init() {
        super.init()
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(self.errorHandler),
                                               name: Notification.Name(API_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                               object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self,
                                                  name: Notification.Name(API_CLIENT_EVENTS["CLIENT_ERROR"]!),
                                                  object: nil)
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
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

        let rootQueue = DispatchQueue(label: "com.mattermost.react-native-network-client.rootQueue")
        var sessionDelegate: SessionDelegate? = nil
        rootQueue.sync {
            sessionDelegate = APIClientSessionDelegate()
        }

        let options = JSON(options)
        if options != JSON.null {
            let configuration = getURLSessionConfiguration(from: options)
            let interceptor = getSessionInterceptor(from: options)
            let redirectHandler = Redirector(behavior: .doNotFollow)
            let retryPolicy = getRetryPolicy(from: options)
            let cancelRequestsOnUnauthorized = options["sessionConfiguration"]["cancelRequestsOnUnauthorized"].boolValue
            let bearerAuthTokenResponseHeader = options["requestAdapterConfiguration"]["bearerAuthTokenResponseHeader"].string
            let clientP12Configuration = options["clientP12Configuration"].dictionaryObject as? [String:String]
            let trustSelfSignedServerCertificate = options["sessionConfiguration"]["trustSelfSignedServerCertificate"].boolValue

            resolve(
                SessionManager.default.createSession(for: baseUrl,
                                                     withRootQueue: rootQueue,
                                                     withDelegate: sessionDelegate!,
                                                     withConfiguration: configuration,
                                                     withInterceptor: interceptor,
                                                     withRedirectHandler: redirectHandler,
                                                     withRetryPolicy: retryPolicy,
                                                     withCancelRequestsOnUnauthorized: cancelRequestsOnUnauthorized,
                                                     withBearerAuthTokenResponseHeader: bearerAuthTokenResponseHeader,
                                                     withClientP12Configuration: clientP12Configuration,
                                                     withTrustSelfSignedServerCertificate: trustSelfSignedServerCertificate)
            )

            return
        }
        

        resolve(SessionManager.default.createSession(for: baseUrl, withRootQueue: rootQueue, withDelegate: sessionDelegate!))
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

        do {
            try resolve(Keychain.importClientP12(withPath: path, withPassword: password, forHost: session.baseUrl.host!))
        } catch {
            reject("\(error._code)", error.localizedDescription, error)
        }
    }

    @objc(head:forEndpoint:withOptions:withResolver:withRejecter:)
    func head(baseUrl: String, endpoint: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: baseUrl, withEndpoint: endpoint, withMethod: .head, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
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

        let urlString = "\(baseUrl.absoluteString)\(endpoint)"
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        upload(fileUrl, to: url, forSession: session, withTaskId: taskId, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc(download:forEndpoint:withFilePath:withTaskId:withOptions:withResolver:withRejecter:)
    func upload(baseUrlString: String, endpoint: String, filePath: String, taskId: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let baseUrl = URL(string: baseUrlString) else {
            rejectMalformed(url: baseUrlString, withRejecter: reject)
            return
        }
        
        let destinationUrl = NSURL.fileURL(withPath: filePath)
        do {
            let parentDir = destinationUrl.deletingLastPathComponent()
            var isDir : ObjCBool = false
            if(!FileManager.default.fileExists(atPath: parentDir.path, isDirectory: &isDir)) {
                try FileManager.default.createDirectory(atPath: parentDir.path, withIntermediateDirectories: true)
            }
        } catch {
            reject("\(error._code)", error.localizedDescription, error)
            return
        }

        guard let session = SessionManager.default.getSession(for: baseUrl) else {
            rejectInvalidSession(for: baseUrl, withRejecter: reject)
            return
        }

        let urlString = "\(baseUrl.absoluteString)\(endpoint)"
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        download(url, to: destinationUrl, forSession: session, withTaskId: taskId, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    func upload(_ fileUrl: URL, to url: URL, forSession session: Session, withTaskId taskId: String, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let fileSize = try? Double(fileUrl.fileSize()) else {
            rejectFileSize(for: fileUrl, withRejecter: reject)
            return
        }
        
        if let _ = options["multipart"].dictionary {
            self.multipartUpload(fileUrl, to: url, forSession: session, withFileSize: fileSize, withTaskId: taskId, withOptions: options, withResolver: resolve, withRejecter: reject)
        } else {
            self.streamUpload(fileUrl, to: url, forSession: session, withFileSize: fileSize, withTaskId: taskId, withOptions: options, withResolver: resolve, withRejecter: reject)
        }
    }
    
    func download(_ url: URL, to destinationUrl: URL, forSession session: Session, withTaskId taskId: String, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let headers = getHTTPHeaders(from: options)
        let requestModifer = getRequestModifier(from: options)
        let destination: DownloadRequest.Destination = { _, _ in
            return (destinationUrl, [.removePreviousFile])
        }
        
        let request = session.download(url, method: .get, parameters: nil, encoding: URLEncoding.default, headers: headers, interceptor: nil, requestModifier: requestModifer, to: destination)

        request.downloadProgress { progress in
                if (self.hasListeners) {
                    if (progress.fractionCompleted >= 0.0) {
                        self.sendEvent(withName: API_CLIENT_EVENTS["DOWNLOAD_PROGRESS"], body: ["taskId": taskId, "fractionCompleted": progress.fractionCompleted, "bytesRead": progress.completedUnitCount])
                    }
                }
            }
            .responseURL { data in
                if data.response?.statusCode == 401 && session.cancelRequestsOnUnauthorized {
                    session.cancelAllRequests()
                }
                self.resolveOrRejectDownloadResponse(data, for: request, withResolver: resolve, withRejecter: reject)
            }

        self.requestsTable.setObject(request, forKey: taskId as NSString)
    }
    
    func multipartUpload(
                         _ fileUrl: URL,
                         to url: URL,
                         forSession session: Session,
                         withFileSize fileSize: Double,
                         withTaskId taskId: String,
                         withOptions options: JSON,
                         withResolver resolve: @escaping RCTPromiseResolveBlock,
                         withRejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let headers = getHTTPHeaders(from: options)
        let requestModifer = getRequestModifier(from: options)

        let multipartConfig = options["multipart"].dictionaryValue
        let fileKey = multipartConfig["fileKey"]?.string ?? "files"
        let data = multipartConfig["data"]?.dictionaryValue.mapValues { String(describing: $0) }

        var method: HTTPMethod
        switch options["method"].string?.lowercased() {
            case "patch":
                method = .patch
            case "put":
                method = .put
            default:
                method = .post
        }

        let request = session.upload(
            multipartFormData: { multipartFormData in
                multipartFormData.append(fileUrl, withName: fileKey)
                if let data = data {
                   for (key, value) in data {
                       multipartFormData.append(value.data(using: .utf8)!, withName: key)
                   }
                }
            },
            to: url, method: method,
            headers: headers,
            requestModifier: requestModifer
        )
        
        request
        .uploadProgress { progress in
            if self.hasListeners {
                self.sendEvent(withName: API_CLIENT_EVENTS["UPLOAD_PROGRESS"], body: ["taskId": taskId, "fractionCompleted": progress.fractionCompleted, "bytesRead": progress.completedUnitCount])
                }
        }
        .responseJSON { json in
                self.resolveOrRejectJSONResponse(json, for:request, withResolver: resolve, withRejecter: reject)
        }

        self.requestsTable.setObject(request, forKey: taskId as NSString)
    }
    
    func streamUpload(_ fileUrl: URL, to url: URL, forSession session: Session, withFileSize fileSize: Double, withTaskId taskId: String, withOptions options: JSON, withResolver resolve: @escaping RCTPromiseResolveBlock, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let headers = getHTTPHeaders(from: options)
        let requestModifer = getRequestModifier(from: options)
        
        var method: HTTPMethod
        switch options["method"].string?.uppercased() {
            case "PATCH":
                method = .patch
            case "PUT":
                method = .put
            default:
                method = .post
        }
        
        var initialFractionCompleted: Double = 0;
        let stream = InputStream(url: fileUrl)!
        if let skipBytes = options["skipBytes"].uInt64 {
            stream.setProperty(skipBytes, forKey: .fileCurrentOffsetKey)
            initialFractionCompleted = Double(skipBytes) / fileSize
        }

        let request = session.upload(stream, to: url, method: method, headers: headers, requestModifier: requestModifer)
            .uploadProgress { progress in
                if (self.hasListeners) {
                    let fractionCompleted = initialFractionCompleted + (Double(progress.completedUnitCount) / fileSize)
                    self.sendEvent(withName: API_CLIENT_EVENTS["UPLOAD_PROGRESS"], body: ["taskId": taskId, "fractionCompleted": fractionCompleted])
                }
            }
            .responseJSON { json in
                self.resolveOrRejectJSONResponse(json, withResolver: resolve, withRejecter: reject)
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

        let urlString = "\(baseUrl.absoluteString)\(endpoint)"
        guard let url = URL(string: urlString) else {
            rejectMalformed(url: urlString, withRejecter: reject)
            return
        }

        handleRequest(for: url, withMethod: method, withSession: session, withOptions: options, withResolver: resolve, withRejecter: reject)
    }

    func handleResponse(for session: Session, withUrl url: URL, withData data: AFDataResponse<Any>) -> Void {
        if data.response?.statusCode == 401 && session.cancelRequestsOnUnauthorized {
            session.cancelAllRequests()
        } else if let tokenHeader = session.bearerAuthTokenResponseHeader {
            var token: String?
            if #available(iOS 13.0, *) {
                token = data.response?.value(forHTTPHeaderField: tokenHeader)
            } else {
                token = (data.response?.allHeaderFields[tokenHeader] ??
                            data.response?.allHeaderFields[tokenHeader.lowercased()] ??
                            data.response?.allHeaderFields[tokenHeader.firstUppercased]) as? String
            }
            if let token = token {
                do {
                    try Keychain.setToken(token, forServerUrl: session.baseUrl.absoluteString)
                } catch {
                    sendErrorEvent(for: session.baseUrl.absoluteString, withErrorCode: error._code, withErrorDescription: error.localizedDescription)
                }
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
            config.timeoutIntervalForRequest = sessionOptions["timeoutIntervalForRequest"].doubleValue / 1000
        }

        if sessionOptions["timeoutIntervalForResource"].exists() {
            config.timeoutIntervalForResource = sessionOptions["timeoutIntervalForResource"].doubleValue / 1000
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
    
    func rejectInvalidSession(for baseUrl: URL, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let message = "Session for \(baseUrl.absoluteString) has been invalidated"
        let error = NSError(domain: NSCocoaErrorDomain, code: NSCoderValueNotFoundError, userInfo: [NSLocalizedDescriptionKey: message])

        reject("\(error.code)", message, error)
    }
    
    func rejectFileSize(for fileUrl: URL, withRejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let message = "Unable to read file size for \(fileUrl.absoluteString)"
        let error = NSError(domain: NSCocoaErrorDomain,
                            code: NSCoderValueNotFoundError,
                            userInfo: [NSLocalizedDescriptionKey: message])

        reject("\(error.code)", message, error)
    }
    
    @objc(errorHandler:)
    func errorHandler(notification: Notification) {
        self.sendErrorEvent(for: notification.userInfo!["serverUrl"] as! String,
                              withErrorCode: notification.userInfo!["errorCode"] as! Int,
                              withErrorDescription: notification.userInfo!["errorDescription"] as! String)
    }
    
    func sendErrorEvent(for serverUrl: String, withErrorCode errorCode: Int, withErrorDescription errorDescription: String) {
        if hasListeners {
            self.sendEvent(withName: API_CLIENT_EVENTS["CLIENT_ERROR"],
                           body: ["serverUrl": serverUrl, "errorCode": errorCode, "errorDescription": errorDescription])
        }
    }
}
