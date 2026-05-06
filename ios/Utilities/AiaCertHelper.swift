import Foundation
import Security
import os

/// AIA (Authority Information Access) certificate chain completion for iOS.
///
/// Apple's Security.framework calls AIA automatically during SecTrustEvaluate, but that
/// fetch happens inside the OS and can fail silently on restricted networks or when the
/// AIA server is slow. When SecTrust returns kSecTrustResultRecoverableTrustFailure we
/// attempt a manual AIA fetch, rebuild the trust object, and re-evaluate — giving servers
/// with incomplete chains a second chance without weakening cipher or protocol requirements.
enum AiaCertHelper {

    // AIA OID bytes: 1.3.6.1.5.5.7.1.1
    private static let aiaOID: [UInt8] = [0x2b, 0x06, 0x01, 0x05, 0x05, 0x07, 0x01, 0x01]
    // caIssuers access method OID bytes: 1.3.6.1.5.5.7.48.2
    private static let caIssuersOID: [UInt8] = [0x2b, 0x06, 0x01, 0x05, 0x05, 0x07, 0x30, 0x02]

    /// Attempts to complete the certificate chain in `serverTrust` by fetching missing
    /// intermediates via AIA caIssuers URLs. Returns a new SecTrust with the augmented
    /// chain on success, or nil if nothing could be recovered.
    static func completingChain(for serverTrust: SecTrust, host: String) -> SecTrust? {
        var certs = existingCertificates(from: serverTrust)
        guard let leaf = certs.first else { return nil }

        var tip = leaf

        // Cap at 3 fetches — covers all real-world chain depths.
        for _ in 0..<3 {
            guard !isSelfSigned(tip) else { break }
            guard let aiaUrl = caIssuersUrl(from: tip) else { break }
            guard let intermediate = fetchCertificate(from: aiaUrl) else { break }

            // Loop detection: stop if we already have this cert.
            let newData = SecCertificateCopyData(intermediate) as Data
            if certs.contains(where: { (SecCertificateCopyData($0) as Data) == newData }) { break }

            certs.append(intermediate)
            tip = intermediate
        }

        guard certs.count > existingCertificates(from: serverTrust).count else { return nil }

        var policies: CFArray?
        SecTrustCopyPolicies(serverTrust, &policies)
        guard let trustPolicies = policies else { return nil }

        var newTrust: SecTrust?
        guard SecTrustCreateWithCertificates(certs as CFArray, trustPolicies, &newTrust) == errSecSuccess,
              let trust = newTrust else { return nil }

        if #available(iOS 14.0, *) {
            SecTrustSetNetworkFetchAllowed(trust, true)
        }

        return trust
    }

    // MARK: - Internal helpers (internal for testability)

    static func caIssuersUrl(from cert: SecCertificate) -> URL? {
        let der = SecCertificateCopyData(cert) as Data
        return extractCaIssuersUrl(from: [UInt8](der))
    }

    // MARK: - Private helpers

    private static func existingCertificates(from trust: SecTrust) -> [SecCertificate] {
        if #available(iOS 15.0, *) {
            return (SecTrustCopyCertificateChain(trust) as? [SecCertificate]) ?? []
        } else {
            return (0..<SecTrustGetCertificateCount(trust)).compactMap {
                SecTrustGetCertificateAtIndex(trust, $0)
            }
        }
    }

    /// Determines if a certificate is self-signed by comparing the raw subject and issuer
    /// DER sequences, which is the only reliable cross-platform approach on iOS.
    private static func isSelfSigned(_ cert: SecCertificate) -> Bool {
        let subject = SecCertificateCopyNormalizedSubjectSequence(cert) as Data?
        let issuer  = SecCertificateCopyNormalizedIssuerSequence(cert) as Data?
        guard let s = subject, let i = issuer else { return false }
        return s == i
    }

    /// Parses the caIssuers URI from the raw DER bytes of a certificate by walking the
    /// ASN.1 structure to find the AIA extension and its caIssuers AccessDescription.
    /// This mirrors the Android CertificateChainHelper approach and requires no macOS APIs.
    private static func extractCaIssuersUrl(from der: [UInt8]) -> URL? {
        // A DER certificate is: SEQUENCE { SEQUENCE (tbsCertificate) { ... } ... }
        // We need to find the Extensions SEQUENCE inside tbsCertificate.
        // Rather than fully parsing the TBS structure, we scan for the AIA OID bytes
        // and then back-parse the enclosing extension value.
        guard let aiaOIDOffset = findBytes(aiaOID, in: der) else { return nil }

        // After the AIA OID, the extension value is wrapped in an OCTET STRING.
        // Structure: OID | BOOLEAN (optional, critical) | OCTET STRING { AIA SEQUENCE }
        var pos = aiaOIDOffset + aiaOID.count

        // Skip optional BOOLEAN (critical flag): tag 0x01
        if pos < der.count && der[pos] == 0x01 {
            pos += 1 + 1 + 1  // tag + length(1) + value(1)
        }

        // Expect OCTET STRING (0x04)
        guard pos < der.count && der[pos] == 0x04 else { return nil }
        pos += 1
        let (octetLen, octetLenSize) = lengthAt(der, pos)
        pos += octetLenSize

        // Now at the AIA SEQUENCE contents
        let aiaEnd = pos + octetLen
        guard aiaEnd <= der.count else { return nil }

        // Expect outer SEQUENCE (0x30)
        guard der[pos] == 0x30 else { return nil }
        pos += 1
        let (_, seqLenSize) = lengthAt(der, pos)
        pos += seqLenSize

        // Walk each AccessDescription SEQUENCE
        while pos < aiaEnd {
            guard der[pos] == 0x30 else { break }
            pos += 1
            let (descLen, descLenSize) = lengthAt(der, pos)
            pos += descLenSize
            let descEnd = pos + descLen

            // accessMethod OID
            guard pos < der.count && der[pos] == 0x06 else { pos = descEnd; continue }
            pos += 1
            let (oidLen, oidLenSize) = lengthAt(der, pos)
            pos += oidLenSize
            let oidBytes = Array(der[pos..<min(pos + oidLen, der.count)])
            pos += oidLen

            if oidBytes == caIssuersOID {
                // accessLocation: [6] IMPLICIT IA5String = uniformResourceIdentifier (tag 0x86)
                guard pos < der.count && der[pos] == 0x86 else { pos = descEnd; continue }
                pos += 1
                let (uriLen, uriLenSize) = lengthAt(der, pos)
                pos += uriLenSize
                guard pos + uriLen <= der.count else { return nil }
                let uriString = String(bytes: der[pos..<pos + uriLen], encoding: .ascii)
                return uriString.flatMap { URL(string: $0) }
            }

            pos = descEnd
        }

        return nil
    }

    // Real intermediate CA certs are a few KB; 64 KB is a generous ceiling that rejects
    // a hostile AIA endpoint trying to OOM us during the TLS handshake.
    private static let maxAiaResponseBytes = 64 * 1024

    private static func fetchCertificate(from url: URL) -> SecCertificate? {
        // The URL came from a peer certificate we have not yet trusted. Reject anything
        // that isn't plain HTTP so a hostile cert can't turn AIA chasing into a file://
        // SSRF primitive, and so HTTPS doesn't recurse into another TLS handshake from
        // inside this one. RFC 5280 expects AIA fetches over HTTP.
        guard url.scheme?.lowercased() == "http" else { return nil }

        let semaphore = DispatchSemaphore(value: 0)
        let resultBox = AtomicCertBox()

        var request = URLRequest(url: url, timeoutInterval: 5)
        request.setValue("bytes=0-\(maxAiaResponseBytes - 1)", forHTTPHeaderField: "Range")

        let task = URLSession.shared.dataTask(with: request) { data, _, _ in
            if let data = data, data.count <= maxAiaResponseBytes {
                resultBox.set(SecCertificateCreateWithData(nil, data as CFData))
            }
            semaphore.signal()
        }
        task.resume()

        if semaphore.wait(timeout: .now() + 5) == .timedOut {
            // Cancel the in-flight task so it doesn't accumulate in URLSession.shared
            // and so its callback can't race with our return.
            task.cancel()
            return nil
        }
        return resultBox.get()
    }

    /// Tiny lock-protected box for the cert result so the timeout path and the data-task
    /// callback can never read/write `result` concurrently.
    private final class AtomicCertBox {
        private var value: SecCertificate?
        private var lock = os_unfair_lock()
        func set(_ v: SecCertificate?) {
            os_unfair_lock_lock(&lock); defer { os_unfair_lock_unlock(&lock) }
            value = v
        }
        func get() -> SecCertificate? {
            os_unfair_lock_lock(&lock); defer { os_unfair_lock_unlock(&lock) }
            return value
        }
    }

    /// Finds the first occurrence of `pattern` bytes within `data`. Returns the start index or nil.
    private static func findBytes(_ pattern: [UInt8], in data: [UInt8]) -> Int? {
        guard !pattern.isEmpty, data.count >= pattern.count else { return nil }
        for i in 0...(data.count - pattern.count) {
            if Array(data[i..<i + pattern.count]) == pattern {
                return i
            }
        }
        return nil
    }

    /// Returns (length value, bytes consumed by length field) for a DER length at `pos`.
    private static func lengthAt(_ der: [UInt8], _ pos: Int) -> (Int, Int) {
        guard pos < der.count else { return (0, 1) }
        let first = Int(der[pos])
        if first < 0x80 { return (first, 1) }
        let numBytes = first & 0x7F
        // 0x80 means BER indefinite-length, which isn't valid in DER. Treat as malformed.
        guard numBytes > 0 else { return (0, 1) }
        var len = 0
        for i in 1...numBytes {
            guard pos + i < der.count else { break }
            len = (len << 8) | Int(der[pos + i])
        }
        return (len, 1 + numBytes)
    }
}
