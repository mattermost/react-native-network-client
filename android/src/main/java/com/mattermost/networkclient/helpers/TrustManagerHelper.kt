package com.mattermost.networkclient.helpers

import android.os.Build
import java.io.ByteArrayInputStream
import java.security.KeyStore
import java.security.cert.CertificateFactory
import javax.net.ssl.KeyManager
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

object TrustManagerHelper {

    /**
     * Builds an X509TrustManager that trusts both system and user-installed root CAs (#9337).
     * AndroidCAStore on API 24+ includes certificates installed via Settings → Security →
     * Install certificate (e.g. corporate CAs deployed by MDM).
     */
    fun buildTrustManager(ca: String?): X509TrustManager {
        val trustManagerFactory = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm()
        )

        // AndroidCAStore on API 24+ includes both system and user-installed CAs.
        val keyStore: KeyStore?
        if (ca != null) {
            keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
            keyStore.load(null, "".toCharArray())

            val certificateFactory = CertificateFactory.getInstance("X.509")
            val certificates = certificateFactory.generateCertificates(ByteArrayInputStream(ca.toByteArray()))
            for ((index, certificate) in certificates.withIndex()) {
                keyStore.setCertificateEntry("$index", certificate)
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            keyStore = KeyStore.getInstance("AndroidCAStore")
            keyStore.load(null)
        } else {
            keyStore = null
        }
        trustManagerFactory.init(keyStore)

        return trustManagerFactory.trustManagers
            .filterIsInstance<X509TrustManager>()
            .first()
    }

    /**
     * Returns the KeyManagers for a client-cert PKCS12 KeyStore (mTLS), or null if no
     * client certificate has been imported.
     */
    fun buildKeyManagers(
        clientCertKeyStore: KeyStore?,
        clientCertPassword: CharArray?
    ): Array<KeyManager>? {
        if (clientCertKeyStore == null) return null
        val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        kmf.init(clientCertKeyStore, clientCertPassword ?: CharArray(0))
        return kmf.keyManagers
    }
}
