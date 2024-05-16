import Foundation
import ObjectiveC
import react_native_network_client

@objc class SDWebImageDownloaderOperationSwizzled: NSObject {
  @objc static let shared = SDWebImageDownloaderOperationSwizzled()
  
    @objc func swizzled_init(request: URLRequest, in session: URLSession) -> [Any] {
      let nativeClientSessionManager = SessionManager.default
      if let sessionBaseUrl = nativeClientSessionManager.getSessionBaseUrl(for: request),
         let configuration = nativeClientSessionManager.getSessionConfiguration(for: sessionBaseUrl) {
        let newSession = URLSession(configuration: configuration, delegate: session.delegate, delegateQueue: session.delegateQueue)
        let authorizedRequest = BearerAuthenticationAdapter.addAuthorizationBearerToken(to: request, withSessionBaseUrlString: sessionBaseUrl.absoluteString)
  
        return [authorizedRequest, newSession]
      }
  
      return [request, session]
    }
  
  @objc func handleURLSession(session: URLSession, task: URLSessionTask, challenge: URLAuthenticationChallenge) -> [Any] {
    let nativeClientSessionManager = SessionManager.default
    guard let request = task.currentRequest,
          let sessionBaseUrl = nativeClientSessionManager.getSessionBaseUrl(for: request) else {
      return [NSNumber(value: URLSession.AuthChallengeDisposition.performDefaultHandling.rawValue), NSNull()]
    }
    
    var credential: URLCredential?
    var disposition: URLSession.AuthChallengeDisposition = .performDefaultHandling
    
    let authenticationMethod = challenge.protectionSpace.authenticationMethod
    if authenticationMethod == NSURLAuthenticationMethodServerTrust {
      if nativeClientSessionManager.getTrustSelfSignedServerCertificate(for: sessionBaseUrl) {
        credential = URLCredential(trust: challenge.protectionSpace.serverTrust!)
        disposition = .useCredential
      }
    } else if authenticationMethod == NSURLAuthenticationMethodClientCertificate {
      credential = nativeClientSessionManager.getCredential(for: sessionBaseUrl)
      disposition = .useCredential
    }
    
    return [NSNumber(value: disposition.rawValue), credential ?? NSNull()]
  }
}

