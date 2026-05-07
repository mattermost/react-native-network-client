import Alamofire
import os

extension Session: Equatable {
    static public func == (lhs: Session, rhs: Session) -> Bool {
        return lhs.session == rhs.session
    }
}

fileprivate var baseUrl_FILEPRIVATE : [ObjectIdentifier:URL] = [:]
fileprivate var bearerAuthTokenResponseHeader_FILEPRIVATE : [ObjectIdentifier:String] = [:]
fileprivate var cancelRequestsOnUnauthorized_FILEPRIVATE : [ObjectIdentifier:Bool] = [:]
fileprivate var trustSelfSignedServerCertificate_FILEPRIVATE : [ObjectIdentifier:Bool] = [:]
fileprivate var retryPolicy_FILEPRIVATE : [ObjectIdentifier:RetryPolicy] = [:]
fileprivate var collectMetrics_FILEPRIVATE : [ObjectIdentifier:Bool] = [:]
fileprivate var certErrorEmitted_FILEPRIVATE : [ObjectIdentifier:Bool] = [:]
fileprivate var lastServerCertSummary_FILEPRIVATE : [ObjectIdentifier:String] = [:]

// All extension-property dictionaries are read and written from arbitrary threads
// (URLSession delegate callbacks, the JS bridge queue, session invalidation). Swift
// Dictionary mutation across threads is undefined behaviour, so every access goes
// through this lock. os_unfair_lock is used for its low overhead on tiny critical sections.
fileprivate var sessionExtensionLock = os_unfair_lock()

fileprivate func withSessionExtensionLock<T>(_ body: () -> T) -> T {
    os_unfair_lock_lock(&sessionExtensionLock)
    defer { os_unfair_lock_unlock(&sessionExtensionLock) }
    return body()
}

extension Session {
    var baseUrl: URL? {
        get { withSessionExtensionLock { baseUrl_FILEPRIVATE[ObjectIdentifier(self)] } }
        set { withSessionExtensionLock { baseUrl_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var bearerAuthTokenResponseHeader: String? {
        get { withSessionExtensionLock { bearerAuthTokenResponseHeader_FILEPRIVATE[ObjectIdentifier(self)] } }
        set { withSessionExtensionLock { bearerAuthTokenResponseHeader_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var cancelRequestsOnUnauthorized: Bool {
        get { withSessionExtensionLock { cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] ?? false } }
        set { withSessionExtensionLock { cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var trustSelfSignedServerCertificate: Bool {
        get { withSessionExtensionLock { trustSelfSignedServerCertificate_FILEPRIVATE[ObjectIdentifier(self)] ?? false } }
        set { withSessionExtensionLock { trustSelfSignedServerCertificate_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var retryPolicy: RetryPolicy? {
        get { withSessionExtensionLock { retryPolicy_FILEPRIVATE[ObjectIdentifier(self)] } }
        set { withSessionExtensionLock { retryPolicy_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var collectMetrics: Bool {
        get { withSessionExtensionLock { collectMetrics_FILEPRIVATE[ObjectIdentifier(self)] ?? false } }
        set { withSessionExtensionLock { collectMetrics_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var certErrorEmitted: Bool {
        get { withSessionExtensionLock { certErrorEmitted_FILEPRIVATE[ObjectIdentifier(self)] ?? false } }
        set { withSessionExtensionLock { certErrorEmitted_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    var lastServerCertSummary: String? {
        get { withSessionExtensionLock { lastServerCertSummary_FILEPRIVATE[ObjectIdentifier(self)] } }
        set { withSessionExtensionLock { lastServerCertSummary_FILEPRIVATE[ObjectIdentifier(self)] = newValue } }
    }

    /// Removes all extension-stored properties for this Session. Call when the Session is
    /// being invalidated so the global dictionaries don't retain data for deallocated sessions.
    func cleanupExtensionProperties() {
        let key = ObjectIdentifier(self)
        withSessionExtensionLock {
            baseUrl_FILEPRIVATE.removeValue(forKey: key)
            bearerAuthTokenResponseHeader_FILEPRIVATE.removeValue(forKey: key)
            cancelRequestsOnUnauthorized_FILEPRIVATE.removeValue(forKey: key)
            trustSelfSignedServerCertificate_FILEPRIVATE.removeValue(forKey: key)
            retryPolicy_FILEPRIVATE.removeValue(forKey: key)
            collectMetrics_FILEPRIVATE.removeValue(forKey: key)
            certErrorEmitted_FILEPRIVATE.removeValue(forKey: key)
            lastServerCertSummary_FILEPRIVATE.removeValue(forKey: key)
        }
    }
}
