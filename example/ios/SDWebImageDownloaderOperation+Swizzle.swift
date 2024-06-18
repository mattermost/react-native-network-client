import Foundation
import ObjectiveC
import react_native_network_client

extension SDWebImageDownloaderOperation {

  static let swizzleInitMethod: Void = {
    let originalSelector = #selector(SDWebImageDownloaderOperation.init(request:in:options:context:))
    let swizzledSelector = #selector(SDWebImageDownloaderOperation.swizzled_init(request:in:options:context:))
    
    if let originalMethod = class_getInstanceMethod(SDWebImageDownloaderOperation.self, originalSelector),
       let swizzledMethod = class_getInstanceMethod(SDWebImageDownloaderOperation.self, swizzledSelector) {
      method_exchangeImplementations(originalMethod, swizzledMethod)
    }
  }()

  static let swizzleURLSessionTaskDelegateMethod: Void = {
    let originalSelector = #selector(URLSessionDelegate.urlSession(_:didReceive:completionHandler:))
    let swizzledSelector = #selector(SDWebImageDownloaderOperation.swizzled_urlSession(_:task:didReceive:completionHandler:))
    
    if let originalMethod = class_getInstanceMethod(SDWebImageDownloaderOperation.self, originalSelector),
       let swizzledMethod = class_getInstanceMethod(SDWebImageDownloaderOperation.self, swizzledSelector) {
      method_exchangeImplementations(originalMethod, swizzledMethod)
    }
  }()

  @objc func swizzled_init(request: URLRequest, in session: URLSession, options: SDWebImageDownloaderOptions, context: SDWebImageContextOption?) -> Self {
    let nativeClientSessionManager = SessionManager.default
    if let sessionBaseUrl = nativeClientSessionManager.getSessionBaseUrl(for: request),
       let configuration = nativeClientSessionManager.getSessionConfiguration(for: sessionBaseUrl) {
      let newSession = URLSession(configuration: configuration, delegate: session.delegate, delegateQueue: session.delegateQueue)
      let authorizedRequest = BearerAuthenticationAdapter.addAuthorizationBearerToken(to: request, withSessionBaseUrlString: sessionBaseUrl.absoluteString)
      
      return self.swizzled_init(request: authorizedRequest, in: newSession, options: options, context: context)
    }
    
    return self.swizzled_init(request: request, in: session, options: options, context: context)
  }

  @objc func swizzled_urlSession(_ session: URLSession, task: URLSessionTask, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    let nativeClientSessionManager = SessionManager.default
    if let currentRequest = task.currentRequest,
       let sessionBaseUrl = nativeClientSessionManager.getSessionBaseUrl(for: currentRequest) {
      var credential: URLCredential?
      var disposition: URLSession.AuthChallengeDisposition = .performDefaultHandling
      
      let authenticationMethod = challenge.protectionSpace.authenticationMethod
      if authenticationMethod == NSURLAuthenticationMethodServerTrust,
         nativeClientSessionManager.getTrustSelfSignedServerCertificate(for: sessionBaseUrl) {
        credential = URLCredential(trust: challenge.protectionSpace.serverTrust!)
        disposition = .useCredential
      } else if authenticationMethod == NSURLAuthenticationMethodClientCertificate {
        credential = nativeClientSessionManager.getCredential(for: sessionBaseUrl)
        disposition = .useCredential
      }
      
      completionHandler(disposition, credential)
      return
    }
    
    self.swizzled_urlSession(session, task: task, didReceive: challenge, completionHandler: completionHandler)
  }
}

// Ensure swizzling occurs once the class is loaded
extension SDWebImageDownloaderOperation {
  static func swizzle() {
    _ = self.swizzleInitMethod
    _ = self.swizzleURLSessionTaskDelegateMethod
  }
}

@objc public class SDImageDownloadSwizzleHelper: NSObject {
    @objc public static func performSwizzling() {
        SDWebImageDownloaderOperation.swizzle()
    }
}
