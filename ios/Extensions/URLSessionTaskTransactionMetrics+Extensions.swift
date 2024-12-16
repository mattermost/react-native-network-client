extension URLSessionTaskTransactionMetrics {
    func interpretCipherSuite() -> String {
        switch self.negotiatedTLSCipherSuite {
        case .none:
            return "None"
        case .AES_128_GCM_SHA256:
            return "TLS_AES_128_GCM_SHA256"
        case .AES_256_GCM_SHA384:
            return "TLS_AES_256_GCM_SHA384"
        case .some(.RSA_WITH_3DES_EDE_CBC_SHA):
            return "RSA_WITH_3DES_EDE_CBC_SHA"
        case .some(.RSA_WITH_AES_128_CBC_SHA):
            return "RSA_WITH_AES_128_CBC_SHA"
        case .some(.RSA_WITH_AES_256_CBC_SHA):
            return "RSA_WITH_AES_256_CBC_SHA"
        case .some(.RSA_WITH_AES_128_GCM_SHA256):
            return "RSA_WITH_AES_128_GCM_SHA256"
        case .some(.RSA_WITH_AES_256_GCM_SHA384):
            return "RSA_WITH_AES_256_GCM_SHA384"
        case .some(.RSA_WITH_AES_128_CBC_SHA256):
            return "RSA_WITH_AES_128_CBC_SHA256"
        case .some(.RSA_WITH_AES_256_CBC_SHA256):
            return "RSA_WITH_AES_256_CBC_SHA256"
        case .some(.ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA):
            return "ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA"
        case .some(.ECDHE_ECDSA_WITH_AES_128_CBC_SHA):
            return "ECDHE_ECDSA_WITH_AES_128_CBC_SHA"
        case .some(.ECDHE_ECDSA_WITH_AES_256_CBC_SHA):
            return "ECDHE_ECDSA_WITH_AES_256_CBC_SHA"
        case .some(.ECDHE_RSA_WITH_3DES_EDE_CBC_SHA):
            return "ECDHE_RSA_WITH_3DES_EDE_CBC_SHA"
        case .some(.ECDHE_RSA_WITH_AES_128_CBC_SHA):
            return "ECDHE_RSA_WITH_AES_128_CBC_SHA"
        case .some(.ECDHE_RSA_WITH_AES_256_CBC_SHA):
            return "ECDHE_RSA_WITH_AES_256_CBC_SHA"
        case .some(.ECDHE_ECDSA_WITH_AES_128_CBC_SHA256):
            return "ECDHE_ECDSA_WITH_AES_128_CBC_SHA256"
        case .some(.ECDHE_ECDSA_WITH_AES_256_CBC_SHA384):
            return "ECDHE_ECDSA_WITH_AES_256_CBC_SHA384"
        case .some(.ECDHE_RSA_WITH_AES_128_CBC_SHA256):
            return "ECDHE_RSA_WITH_AES_128_CBC_SHA256"
        case .some(.ECDHE_RSA_WITH_AES_256_CBC_SHA384):
            return "ECDHE_RSA_WITH_AES_256_CBC_SHA384"
        case .some(.ECDHE_ECDSA_WITH_AES_128_GCM_SHA256):
            return "ECDHE_ECDSA_WITH_AES_128_GCM_SHA256"
        case .some(.ECDHE_ECDSA_WITH_AES_256_GCM_SHA384):
            return "ECDHE_ECDSA_WITH_AES_256_GCM_SHA384"
        case .some(.ECDHE_RSA_WITH_AES_128_GCM_SHA256):
            return "ECDHE_RSA_WITH_AES_128_GCM_SHA256"
        case .some(.ECDHE_RSA_WITH_AES_256_GCM_SHA384):
            return "ECDHE_RSA_WITH_AES_256_GCM_SHA384"
        case .some(.ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256):
            return "ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256"
        case .some(.ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256):
            return "ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256"
        case .some(.CHACHA20_POLY1305_SHA256):
            return "CHACHA20_POLY1305_SHA256"
        case .some(_):
            return "Unknown cipher suite"
        }
    }
}
