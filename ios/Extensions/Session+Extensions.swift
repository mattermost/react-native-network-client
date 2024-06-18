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

extension Session {
    var baseUrl: URL {
        get { return baseUrl_FILEPRIVATE[ObjectIdentifier(self)]!}
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
}
