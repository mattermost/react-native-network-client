package com.mattermost.networkclient.helpers

import android.os.Build
import java.security.KeyStore
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
