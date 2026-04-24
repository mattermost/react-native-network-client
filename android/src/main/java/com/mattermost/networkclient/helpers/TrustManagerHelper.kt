package com.mattermost.networkclient.helpers

import android.os.Build
import java.security.KeyStore
import java.security.SecureRandom
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

object TrustManagerHelper {

    /**
     * Builds an X509TrustManager that trusts both system and user-installed root CAs (#9337).
     * AndroidCAStore on API 24+ includes certificates installed via Settings → Security →
     * Install certificate (e.g. corporate CAs deployed by MDM).
     */
    fun buildTrustManager(): X509TrustManager {
        val trustManagerFactory = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm()
        )

        // AndroidCAStore on API 24+ includes both system and user-installed CAs.
        val keyStore = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            KeyStore.getInstance("AndroidCAStore").apply { load(null) }
        } else {
            null
        }
        trustManagerFactory.init(keyStore)

        return trustManagerFactory.trustManagers
            .filterIsInstance<X509TrustManager>()
            .first()
    }

    /**
     * Builds an SSLSocketFactory paired with an X509TrustManager. When a client certificate
     * KeyStore is provided it is wired in via KeyManagerFactory for mTLS support.
     */
    fun buildSslSocketFactory(
        clientCertKeyStore: KeyStore?,
        clientCertPassword: CharArray?
    ): Pair<SSLSocketFactory, X509TrustManager> {
        val trustManager = buildTrustManager()

        val keyManagers = if (clientCertKeyStore != null) {
            val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
            kmf.init(clientCertKeyStore, clientCertPassword ?: CharArray(0))
            kmf.keyManagers
        } else {
            null
        }

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(keyManagers, arrayOf(trustManager), SecureRandom())

        return Pair(sslContext.socketFactory, trustManager)
    }
}
