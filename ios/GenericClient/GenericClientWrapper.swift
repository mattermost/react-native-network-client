import Alamofire
import SwiftyJSON

@objc public class GenericClientWrapper: NSObject, NetworkClient {
    var session = Session(redirectHandler: Redirector(behavior: .follow))

    @objc public func head(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .head, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }

    @objc public func get(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .get, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc public func put(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .put, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc public func post(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .post, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc public func patch(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .patch, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
    
    @objc public func delete(url: String, options: Dictionary<String, Any>, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        handleRequest(for: url, withMethod: .delete, withSession: session, withOptions: JSON(options), withResolver: resolve, withRejecter: reject)
    }
}
