package com.mattermost.networkclient.helpers

import java.io.ByteArrayInputStream
import java.net.URL
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

/**
 * AIA (Authority Information Access) certificate chain completion.
 *
 * When a server sends an incomplete chain (missing one or more intermediate CAs), the
 * leaf certificate's AIA extension contains a caIssuers URL where the missing intermediate
 * can be fetched. This is a common cause of SSL Labs grade B — the server certificate is
 * valid but the chain was not fully sent by the server.
 *
 * The AIA OID (1.3.6.1.5.5.7.1.1) extension value is DER-encoded. We parse just enough
 * ASN.1 to extract the caIssuers URI (access method OID 1.3.6.1.5.5.7.48.2, GeneralName
 * tag 0x86 = uniformResourceIdentifier) without an external ASN.1 library.
 */
object CertificateChainHelper {

    private const val AIA_OID = "1.3.6.1.5.5.7.1.1"

    // DER encoding of the caIssuers access method OID (1.3.6.1.5.5.7.48.2)
    private val CA_ISSUERS_OID = byteArrayOf(0x2b, 0x06, 0x01, 0x05, 0x05, 0x07, 0x30, 0x02)

    /**
     * Attempts to complete an incomplete certificate chain by fetching missing intermediates
     * via the AIA caIssuers extension of each chain-end certificate. Returns the augmented
     * chain, or the original chain unchanged if AIA is unavailable or fetching fails.
     *
     * Cap of 3 fetches covers Leaf → 3 intermediates → Root, which is the deepest
     * legitimate chain seen in practice. Anything deeper is misconfigured.
     */
    fun completeChain(chain: Array<X509Certificate>): Array<X509Certificate> {
        val result = chain.toMutableList()

        repeat(3) {
            val tip = result.last()
            // Self-signed: we've reached a root, nothing more to fetch.
            if (tip.subjectX500Principal == tip.issuerX500Principal) return result.toTypedArray()

            val aiaUrl = extractCaIssuersUrl(tip) ?: return result.toTypedArray()
            val intermediate = fetchCertificate(aiaUrl) ?: return result.toTypedArray()

            // Loop detection: stop if this cert is already in the chain.
            if (result.any {
                    it.serialNumber == intermediate.serialNumber &&
                    it.issuerX500Principal == intermediate.issuerX500Principal
                }) {
                return result.toTypedArray()
            }

            result.add(intermediate)
        }

        return result.toTypedArray()
    }

    /**
     * Extracts the caIssuers URL from the AIA extension of an X509 certificate.
     * Returns null if the extension is absent or contains no caIssuers entry.
     */
    fun extractCaIssuersUrl(cert: X509Certificate): String? {
        // getExtensionValue returns the extension value wrapped in a DER OCTET STRING.
        val octetString = cert.getExtensionValue(AIA_OID) ?: return null
        // Unwrap the outer OCTET STRING to get the actual AIA SEQUENCE.
        val der = unwrapOctetString(octetString) ?: return null
        return parseAiaCaIssuersUrl(der)
    }

    // Walks the AIA SEQUENCE looking for an AccessDescription whose accessMethod OID is
    // caIssuers (1.3.6.1.5.5.7.48.2) and returns its uniformResourceIdentifier value.
    private fun parseAiaCaIssuersUrl(der: ByteArray): String? {
        // Skip the outer SEQUENCE tag and length to reach the contents.
        if (der.isEmpty() || der[0].toInt() and 0xFF != 0x30) return null
        var pos = 1 + lengthSize(der, 1)

        while (pos < der.size) {
            // Each entry is an AccessDescription SEQUENCE.
            if (der[pos].toInt() and 0xFF != 0x30) break
            pos++
            val seqLen = lengthAt(der, pos)
            val seqLenSize = lengthSize(der, pos)
            pos += seqLenSize
            val seqEnd = pos + seqLen

            // accessMethod OID
            if (pos >= der.size || der[pos].toInt() and 0xFF != 0x06) { pos = seqEnd; continue }
            pos++
            val oidLen = lengthAt(der, pos)
            pos += lengthSize(der, pos)
            val oidBytes = der.copyOfRange(pos, pos + oidLen)
            pos += oidLen

            if (oidBytes.contentEquals(CA_ISSUERS_OID)) {
                // accessLocation: GeneralName [6] IMPLICIT IA5String = uniformResourceIdentifier
                if (pos < der.size && der[pos].toInt() and 0xFF == 0x86) {
                    pos++
                    val uriLen = lengthAt(der, pos)
                    pos += lengthSize(der, pos)
                    return String(der, pos, uriLen, Charsets.US_ASCII)
                }
            }

            pos = seqEnd
        }

        return null
    }

    private fun fetchCertificate(url: String): X509Certificate? {
        return try {
            val conn = URL(url).openConnection()
            conn.connectTimeout = 5_000
            conn.readTimeout = 5_000
            conn.connect()
            val bytes = conn.getInputStream().use { it.readBytes() }
            val factory = CertificateFactory.getInstance("X.509")
            factory.generateCertificate(ByteArrayInputStream(bytes)) as X509Certificate
        } catch (_: Exception) {
            null
        }
    }

    // Unwraps a DER OCTET STRING (tag 0x04) to return its contents.
    private fun unwrapOctetString(der: ByteArray): ByteArray? {
        if (der.isEmpty() || der[0].toInt() and 0xFF != 0x04) return null
        val len = lengthAt(der, 1)
        val pos = 1 + lengthSize(der, 1)
        return der.copyOfRange(pos, pos + len)
    }

    // Returns the integer value encoded in the DER length field at der[pos].
    private fun lengthAt(der: ByteArray, pos: Int): Int {
        if (pos >= der.size) return 0
        val first = der[pos].toInt() and 0xFF
        if (first < 0x80) return first
        val numBytes = first and 0x7F
        var len = 0
        for (i in 1..numBytes) {
            if (pos + i >= der.size) return 0
            len = (len shl 8) or (der[pos + i].toInt() and 0xFF)
        }
        return len
    }

    // Returns the byte count of the DER length field at der[pos].
    private fun lengthSize(der: ByteArray, pos: Int): Int {
        if (pos >= der.size) return 1
        val first = der[pos].toInt() and 0xFF
        return if (first < 0x80) 1 else 1 + (first and 0x7F)
    }
}
