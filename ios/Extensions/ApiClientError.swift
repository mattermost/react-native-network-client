import Foundation

enum APIClientError: Error {
    case ClientCertificateMissing
    case ServerCertificateInvalid
    case ServerTrustEvaluationFailed
}

enum BaseURLError: Error {
    case missingBaseURL
    
    var errorDescription: String? {
        switch self {
        case .missingBaseURL:
            return "The base URL has not been set"
        }
    }
}

extension APIClientError: LocalizedError {
    var errorCode: Int {
        switch self {
        case .ClientCertificateMissing: return -200
        case .ServerCertificateInvalid: return -299
        case .ServerTrustEvaluationFailed: return -298
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .ClientCertificateMissing:
            return "Failed to authenticate: missing client certificate"
        case .ServerCertificateInvalid:
            return "Invalid or not trusted server certificate"
        case .ServerTrustEvaluationFailed:
            return ""
        }
    }
}
