import Foundation
import Alamofire

open class ExponentialRetryPolicy: RetryPolicy {
    override open func retry(_ request: Request,
                             for session: Session,
                             dueTo error: Error,
                             completion: @escaping (RetryResult) -> Void) {
        if shouldRetry(request: request, dueTo: error) {
            if request.retryCount < retryLimit {
                completion(.retryWithDelay(pow(Double(exponentialBackoffBase), Double(request.retryCount)) * exponentialBackoffScale))
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
