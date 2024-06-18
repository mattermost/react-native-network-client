import Foundation

enum APIClientError: Error {
    case ClientCertificateMissing
    case ServerCertificateInvalid
}

extension APIClientError: LocalizedError {
    var errorCode: Int {
        switch self {
        case .ClientCertificateMissing: return -200
        case .ServerCertificateInvalid: return -299
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .ClientCertificateMissing:
            return "Failed to authenticate: missing client certificate"
        case .ServerCertificateInvalid:
            return "Invalid or not trusted server certificate"
        }
    }
}
