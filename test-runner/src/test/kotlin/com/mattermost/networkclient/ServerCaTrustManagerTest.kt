package com.mattermost.networkclient

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.tls.HandshakeCertificates
import okhttp3.tls.HeldCertificate
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.io.ByteArrayInputStream
import java.net.InetAddress
import java.security.KeyStore
import java.security.cert.CertificateException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLHandshakeException
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

/**
 * Pure-JVM tests for the custom server CA support (sessionConfiguration.serverCa)
 * in TrustManagerHelper.buildTrustManager.
 *
 * The test-runner has no Android SDK, so buildTrustManager is duplicated below
 * rather than imported. The only difference is the `ca == null` branch: production
 * uses AndroidCAStore on API 24+, which does not exist on the JVM, so the copy falls
 * back to the platform default trust store (keyStore = null), as production does
 * below API 24. This copy MUST be kept in sync with TrustManagerHelper.kt.
 */

// ---------------------------------------------------------------------------
// Inline copy of the production function (no Android deps).
// ---------------------------------------------------------------------------

internal fun buildTrustManager(ca: String?): X509TrustManager {
    val trustManagerFactory = TrustManagerFactory.getInstance(
        TrustManagerFactory.getDefaultAlgorithm()
    )

    val keyStore: KeyStore?
    if (ca != null) {
        keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(null, "".toCharArray())

        val certificateFactory = CertificateFactory.getInstance("X.509")
        val certificates = certificateFactory.generateCertificates(ByteArrayInputStream(ca.toByteArray()))
        for ((index, certificate) in certificates.withIndex()) {
            keyStore.setCertificateEntry("$index", certificate)
        }
    } else {
        keyStore = null
    }
    trustManagerFactory.init(keyStore)

    return trustManagerFactory.trustManagers
        .filterIsInstance<X509TrustManager>()
        .first()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

class ServerCaTrustManagerTest {

    private lateinit var server: MockWebServer

    // A private root CA, like one an admin would create for servers on 10.0.0.0/8.
    private val rootCa: HeldCertificate = HeldCertificate.Builder()
        .commonName("Test Root CA")
        .certificateAuthority(1)
        .build()

    private val otherRootCa: HeldCertificate = HeldCertificate.Builder()
        .commonName("Other Root CA")
        .certificateAuthority(1)
        .build()

    @Before
    fun setUp() {
        server = MockWebServer()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    // -- Helpers -------------------------------------------------------------

    /** Leaf certificate for an IP-only server (no domain name), signed by [issuer]. */
    private fun serverCertificate(issuer: HeldCertificate): HeldCertificate =
        HeldCertificate.Builder()
            .commonName("mattermost")
            .addSubjectAlternativeName(LOCALHOST_IP)
            .signedBy(issuer)
            .build()

    /** Starts the mock server over HTTPS, presenting [leaf] followed by [chain]. */
    private fun startHttpsServer(leaf: HeldCertificate, vararg chain: X509Certificate) {
        val serverCertificates = HandshakeCertificates.Builder()
            .heldCertificate(leaf, *chain)
            .build()
        server.useHttps(serverCertificates.sslSocketFactory(), false)
        server.enqueue(MockResponse().setBody("ok"))
        server.start(InetAddress.getByName(LOCALHOST_IP), 0)
    }

    /** Builds an OkHttp client the same way NetworkClient.configureSsl wires the trust manager. */
    private fun clientTrusting(trustManager: X509TrustManager): OkHttpClient {
        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, arrayOf(trustManager), java.security.SecureRandom())
        return OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustManager)
            .build()
    }

    private fun get(client: OkHttpClient): String? {
        // Build the URL from the IP literal: server.url() uses a reverse-resolved host name
        // ("localhost"), which would not match the certificate's IP SAN.
        val request = Request.Builder().url("https://$LOCALHOST_IP:${server.port}/api/v4/system/ping").build()
        client.newCall(request).execute().use { response ->
            assertEquals(200, response.code)
            return response.body?.string()
        }
    }

    private fun assertHandshakeFails(client: OkHttpClient) {
        try {
            get(client)
            fail("Expected the TLS handshake to fail")
        } catch (e: SSLHandshakeException) {
            // expected
        }
    }

    // -- Trust store contents ------------------------------------------------

    @Test
    fun buildTrustManager_withSingleCa_trustsOnlyThatCa() {
        val trustManager = buildTrustManager(rootCa.certificatePem())

        val issuers = trustManager.acceptedIssuers
        assertEquals(1, issuers.size)
        assertEquals(rootCa.certificate, issuers[0])
    }

    @Test
    fun buildTrustManager_withCaBundle_trustsEveryCertificateInIt() {
        val bundle = rootCa.certificatePem() + otherRootCa.certificatePem()

        val issuers = buildTrustManager(bundle).acceptedIssuers.toSet()

        assertEquals(setOf(rootCa.certificate, otherRootCa.certificate), issuers)
    }

    @Test
    fun buildTrustManager_withCustomCa_doesNotTrustSystemCas() {
        val systemIssuers = buildTrustManager(null).acceptedIssuers
        assertTrue("JVM default trust store should not be empty", systemIssuers.isNotEmpty())

        val customIssuers = buildTrustManager(rootCa.certificatePem()).acceptedIssuers

        assertTrue(customIssuers.none { it in systemIssuers })
    }

    @Test(expected = CertificateException::class)
    fun buildTrustManager_withInvalidPem_throwsCertificateException() {
        buildTrustManager("not a certificate")
    }

    @Test
    fun buildTrustManager_withEmptyCa_trustsNothing() {
        val trustManager = buildTrustManager("")

        assertEquals(0, trustManager.acceptedIssuers.size)
        try {
            trustManager.checkServerTrusted(arrayOf(serverCertificate(rootCa).certificate), "RSA")
            fail("An empty CA must not trust any server")
        } catch (e: Exception) {
            // expected: CertificateException or RuntimeException (no trust anchors)
        }
    }

    // -- TLS handshakes ------------------------------------------------------

    @Test
    fun https_toIpServerSignedByCustomCa_succeeds() {
        startHttpsServer(serverCertificate(rootCa))

        val body = get(clientTrusting(buildTrustManager(rootCa.certificatePem())))

        assertEquals("ok", body)
    }

    @Test
    fun https_toServerSignedByCustomCa_failsWithDefaultTrustStore() {
        startHttpsServer(serverCertificate(rootCa))

        assertHandshakeFails(clientTrusting(buildTrustManager(null)))
    }

    @Test
    fun https_toServerSignedByAnotherCa_fails() {
        startHttpsServer(serverCertificate(otherRootCa))

        assertHandshakeFails(clientTrusting(buildTrustManager(rootCa.certificatePem())))
    }

    @Test
    fun https_withCaBundle_acceptsServerSignedByAnyCaInBundle() {
        startHttpsServer(serverCertificate(otherRootCa))
        val bundle = rootCa.certificatePem() + otherRootCa.certificatePem()

        val body = get(clientTrusting(buildTrustManager(bundle)))

        assertEquals("ok", body)
    }

    @Test
    fun https_toServerSignedByIntermediate_succeedsWhenOnlyRootIsTrusted() {
        val intermediate = HeldCertificate.Builder()
            .commonName("Test Intermediate CA")
            .certificateAuthority(0)
            .signedBy(rootCa)
            .build()
        startHttpsServer(serverCertificate(intermediate), intermediate.certificate)

        val body = get(clientTrusting(buildTrustManager(rootCa.certificatePem())))

        assertEquals("ok", body)
    }

    @Test
    fun https_withSelfSignedServerCertificateAsCa_succeeds() {
        // Servers "outside of user control" often use a self-signed leaf; pinning that
        // certificate itself as serverCa should be enough to connect.
        val selfSigned = HeldCertificate.Builder()
            .commonName("self-signed")
            .addSubjectAlternativeName(LOCALHOST_IP)
            .build()
        startHttpsServer(selfSigned)

        val body = get(clientTrusting(buildTrustManager(selfSigned.certificatePem())))

        assertEquals("ok", body)
    }

    @Test
    fun https_toServerWithWrongHostname_failsEvenWhenCaIsTrusted() {
        // A custom CA must not disable hostname verification.
        val wrongHost = HeldCertificate.Builder()
            .commonName("mattermost")
            .addSubjectAlternativeName("10.1.2.3")
            .signedBy(rootCa)
            .build()
        startHttpsServer(wrongHost)

        try {
            get(clientTrusting(buildTrustManager(rootCa.certificatePem())))
            fail("Expected hostname verification to fail")
        } catch (e: javax.net.ssl.SSLPeerUnverifiedException) {
            // expected
        }
    }

    private companion object {
        const val LOCALHOST_IP = "127.0.0.1"
    }
}
