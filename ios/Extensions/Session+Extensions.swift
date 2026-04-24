import Alamofire

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

extension Session {
    var baseUrl: URL? {
        get { return baseUrl_FILEPRIVATE[ObjectIdentifier(self)]}
        set { baseUrl_FILEPRIVATE[ObjectIdentifier(self)] = newValue}
    }

    var bearerAuthTokenResponseHeader: String? {
        get { return bearerAuthTokenResponseHeader_FILEPRIVATE[ObjectIdentifier(self)] }
        set { bearerAuthTokenResponseHeader_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }
    
    var cancelRequestsOnUnauthorized: Bool {
        get { return cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] ?? false }
        set { cancelRequestsOnUnauthorized_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }
    
    var trustSelfSignedServerCertificate: Bool {
        get { return trustSelfSignedServerCertificate_FILEPRIVATE[ObjectIdentifier(self)] ?? false }
        set { trustSelfSignedServerCertificate_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }
    
    var retryPolicy: RetryPolicy? {
        get { return retryPolicy_FILEPRIVATE[ObjectIdentifier(self)] }
        set { retryPolicy_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }
    
    var collectMetrics: Bool {
        get { return collectMetrics_FILEPRIVATE[ObjectIdentifier(self)] ?? false }
        set { collectMetrics_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }

    var certErrorEmitted: Bool {
        get { return certErrorEmitted_FILEPRIVATE[ObjectIdentifier(self)] ?? false }
        set { certErrorEmitted_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }

    var lastServerCertSummary: String? {
        get { return lastServerCertSummary_FILEPRIVATE[ObjectIdentifier(self)] }
        set { lastServerCertSummary_FILEPRIVATE[ObjectIdentifier(self)] = newValue }
    }

    /// Removes all extension-stored properties for this Session. Call when the Session is
    /// being invalidated so the global dictionaries don't retain data for deallocated sessions.
    func cleanupExtensionProperties() {
        let key = ObjectIdentifier(self)
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
