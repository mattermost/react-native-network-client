import Foundation
import Alamofire

// An interceptor that determines what retry policy, if any, to retry
// the request with at runtime.
open class RuntimeRetrier: RequestInterceptor {
    open func retry(_ request: Request,
                    for session: Session,
                    dueTo error: Error,
                    completion: @escaping (RetryResult) -> Void) {
        if let retryPolicy = request.request?.retryPolicy ?? session.retryPolicy {
            retryPolicy.retry(request,
                              for: session,
                              dueTo: error,
                              completion: completion)
        } else {
            completion(.doNotRetry)
        }
    }
}
