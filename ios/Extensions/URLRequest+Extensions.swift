import Foundation
import Alamofire

fileprivate var retryPolicy_FILEPRIVATE : [Int:RetryPolicy] = [:]

extension URLRequest {
    var retryPolicy: RetryPolicy? {
        get { return retryPolicy_FILEPRIVATE[self.hashValue] }
        set { retryPolicy_FILEPRIVATE[self.hashValue] = newValue }
    }
    
    func removeRetryPolicy() {
        retryPolicy_FILEPRIVATE.removeValue(forKey: self.hashValue)
    }
}
