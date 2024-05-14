import Foundation
import Alamofire

open class LinearRetryPolicy: RetryPolicy {
    public static let defaultRetryInterval: UInt = 2000
    public let retryInterval: UInt
    
    public init(retryLimit: UInt = RetryPolicy.defaultRetryLimit,
                retryInterval: UInt = LinearRetryPolicy.defaultRetryInterval,
                retryableHTTPMethods: Set<HTTPMethod> = RetryPolicy.defaultRetryableHTTPMethods,
                retryableHTTPStatusCodes: Set<Int> = RetryPolicy.defaultRetryableHTTPStatusCodes,
                retryableURLErrorCodes: Set<URLError.Code> = RetryPolicy.defaultRetryableURLErrorCodes) {
        precondition(retryInterval > 0, "The `retryInterval` must be greater than 0.")
        self.retryInterval = retryInterval
        super.init(retryLimit: retryLimit, retryableHTTPMethods: retryableHTTPMethods, retryableHTTPStatusCodes: retryableHTTPStatusCodes, retryableURLErrorCodes: retryableURLErrorCodes)
    }
    
    override open func retry(_ request: Request,
                             for session: Session,
                             dueTo error: Error,
                             completion: @escaping (RetryResult) -> Void) {
        if shouldRetry(request: request, dueTo: error) {
            if request.retryCount < retryLimit {
                completion(.retryWithDelay(Double(retryInterval) / 1000))
            } else if let underlyingError = error.asAFError?.underlyingError {
                // AF calls retry again after deserialization (see https://github.com/Alamofire/Alamofire/issues/3177)
                // Because of this, the error in the second call might already be an instance
                // of `requestRetryFailed` and so we prevent double-wrapping by using the
                // underlying error.
                completion(.doNotRetryWithError(underlyingError))
            } else {
                completion(.doNotRetryWithError(error))
            }
        } else {
            completion(.doNotRetry)
        }
    }
}
