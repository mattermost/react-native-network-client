package com.mattermost.networkclient

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.Assert
import org.junit.Test
import java.io.IOException

/**
 * Self-contained session attributes tests that run on the JVM without Android dependencies.
 *
 * The engine TTL logic, collector interface-type mapping and interceptor guard are reproduced
 * inline here (matching
 * android/src/main/java/com/mattermost/networkclient/sessionattributes and
 * interceptors/SessionAttributesInterceptor.kt) so these tests can run in the pure-JVM
 * test-runner without the Android SDK.
 */
class SessionAttributesTest {

    // ---------------------------------------------------------------------------
    // Inline reproductions matching the real implementation
    // ---------------------------------------------------------------------------

    private fun shouldSend(lastSent: Long?, ttlSeconds: Int, now: Long): Boolean {
        return lastSent == null || ttlSeconds == 0 || (now - lastSent) >= ttlSeconds * 1000L
    }

    private fun interfaceType(
        vpn: Boolean,
        wifi: Boolean,
        cellular: Boolean,
        ethernet: Boolean,
        hasActiveNetwork: Boolean,
    ): String = when {
        vpn -> "vpn"
        wifi -> "wifi"
        cellular -> "cellular"
        ethernet -> "ethernet"
        !hasActiveNetwork -> ""
        else -> "other"
    }

    private class InlineSessionAttributesInterceptor(
        private val serverUrl: String,
        private val headerProvider: (String) -> String?,
    ) : Interceptor {
        @Throws(IOException::class)
        override fun intercept(chain: Interceptor.Chain): Response {
            val request = chain.request()
            val hasAuthorization = request.header("Authorization") != null
            val hasSessionAttributes = request.header(HEADER_NAME) != null
            if (!hasAuthorization || hasSessionAttributes) {
                return chain.proceed(request)
            }
            val header = headerProvider(serverUrl) ?: return chain.proceed(request)
            return chain.proceed(request.newBuilder().header(HEADER_NAME, header).build())
        }

        companion object {
            const val HEADER_NAME = "X-MM-Session-Attributes"
        }
    }

    /**
     * Read-through cache matching SessionAttributesStore: the encrypted backing store is
     * only read on the first access for a server, writes update the cache in place, and
     * removal evicts it.
     */
    private class InlineStateCache(private val backingStore: MutableMap<String, String>) {
        private val cache = mutableMapOf<String, String>()
        var backingReads = 0
            private set

        fun load(serverUrl: String): String? {
            cache[serverUrl]?.let { return it }
            backingReads++
            val restored = backingStore[serverUrl] ?: return null
            cache[serverUrl] = restored
            return restored
        }

        fun save(serverUrl: String, state: String) {
            cache[serverUrl] = state
            backingStore[serverUrl] = state
        }

        fun remove(serverUrl: String) {
            cache.remove(serverUrl)
            backingStore.remove(serverUrl)
        }
    }

    // ---------------------------------------------------------------------------
    // Engine TTL logic
    // ---------------------------------------------------------------------------

    @Test
    fun ttl_sendsWhenNeverSent() {
        Assert.assertTrue(shouldSend(lastSent = null, ttlSeconds = 3600, now = 1_000_000))
    }

    @Test
    fun ttl_alwaysSendsWhenTtlZero() {
        Assert.assertTrue(shouldSend(lastSent = 999_999, ttlSeconds = 0, now = 1_000_000))
    }

    @Test
    fun ttl_doesNotSendWithinWindow() {
        // lastSent 10s ago, ttl 60s -> should not send
        Assert.assertFalse(shouldSend(lastSent = 990_000, ttlSeconds = 60, now = 1_000_000))
    }

    @Test
    fun ttl_sendsWhenWindowElapsed() {
        // lastSent 61s ago, ttl 60s -> should send
        Assert.assertTrue(shouldSend(lastSent = 939_000, ttlSeconds = 60, now = 1_000_000))
    }

    // ---------------------------------------------------------------------------
    // Collector snapshot mapping
    // ---------------------------------------------------------------------------

    @Test
    fun collector_vpnTakesPrecedence() {
        Assert.assertEquals(
            "vpn",
            interfaceType(vpn = true, wifi = true, cellular = false, ethernet = false, hasActiveNetwork = true),
        )
    }

    @Test
    fun collector_mapsTransports() {
        Assert.assertEquals("wifi", interfaceType(false, wifi = true, cellular = false, ethernet = false, hasActiveNetwork = true))
        Assert.assertEquals("cellular", interfaceType(false, wifi = false, cellular = true, ethernet = false, hasActiveNetwork = true))
        Assert.assertEquals("ethernet", interfaceType(false, wifi = false, cellular = false, ethernet = true, hasActiveNetwork = true))
    }

    @Test
    fun collector_emptyWhenNoActiveNetwork() {
        Assert.assertEquals(
            "",
            interfaceType(vpn = false, wifi = false, cellular = false, ethernet = false, hasActiveNetwork = false),
        )
    }

    @Test
    fun collector_otherWhenUnknownTransport() {
        Assert.assertEquals(
            "other",
            interfaceType(vpn = false, wifi = false, cellular = false, ethernet = false, hasActiveNetwork = true),
        )
    }

    // ---------------------------------------------------------------------------
    // Interceptor guard
    // ---------------------------------------------------------------------------

    @Test
    fun interceptor_addsHeaderWhenAuthorizationPresent() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setResponseCode(200))
            server.start()

            val client = OkHttpClient().newBuilder()
                .addInterceptor(InlineSessionAttributesInterceptor(server.url("/").toString()) { "encoded==" })
                .build()
            val request = Request.Builder()
                .url(server.url("/api"))
                .header("Authorization", "Bearer token")
                .build()

            client.newCall(request).execute().close()

            val recorded = server.takeRequest()
            Assert.assertEquals("encoded==", recorded.getHeader("X-MM-Session-Attributes"))
        }
    }

    @Test
    fun interceptor_doesNotAddHeaderWhenNoAuthorization() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setResponseCode(200))
            server.start()

            val client = OkHttpClient().newBuilder()
                .addInterceptor(InlineSessionAttributesInterceptor(server.url("/").toString()) { "encoded==" })
                .build()
            val request = Request.Builder()
                .url(server.url("/api"))
                .build()

            client.newCall(request).execute().close()

            val recorded = server.takeRequest()
            Assert.assertNull(recorded.getHeader("X-MM-Session-Attributes"))
        }
    }

    @Test
    fun interceptor_doesNotOverrideExistingHeader() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setResponseCode(200))
            server.start()

            val client = OkHttpClient().newBuilder()
                .addInterceptor(InlineSessionAttributesInterceptor(server.url("/").toString()) { "engine==" })
                .build()
            val request = Request.Builder()
                .url(server.url("/api"))
                .header("Authorization", "Bearer token")
                .header("X-MM-Session-Attributes", "preset==")
                .build()

            client.newCall(request).execute().close()

            val recorded = server.takeRequest()
            Assert.assertEquals("preset==", recorded.getHeader("X-MM-Session-Attributes"))
        }
    }

    @Test
    fun interceptor_doesNotAddHeaderWhenEngineReturnsNull() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setResponseCode(200))
            server.start()

            val client = OkHttpClient().newBuilder()
                .addInterceptor(InlineSessionAttributesInterceptor(server.url("/").toString()) { null })
                .build()
            val request = Request.Builder()
                .url(server.url("/api"))
                .header("Authorization", "Bearer token")
                .build()

            client.newCall(request).execute().close()

            val recorded = server.takeRequest()
            Assert.assertNull(recorded.getHeader("X-MM-Session-Attributes"))
        }
    }

    // ---------------------------------------------------------------------------
    // Store state cache
    // ---------------------------------------------------------------------------

    @Test
    fun cache_readsBackingStoreOnlyOncePerServer() {
        val cache = InlineStateCache(mutableMapOf("https://server.one" to "state-one"))

        Assert.assertEquals("state-one", cache.load("https://server.one"))
        Assert.assertEquals("state-one", cache.load("https://server.one"))

        Assert.assertEquals(1, cache.backingReads)
    }

    @Test
    fun cache_readsBackingStoreAgainWhenServerHasNoState() {
        val cache = InlineStateCache(mutableMapOf())

        Assert.assertNull(cache.load("https://server.one"))
        Assert.assertNull(cache.load("https://server.one"))

        Assert.assertEquals(2, cache.backingReads)
    }

    @Test
    fun cache_writeServesSubsequentReadsWithoutBackingStore() {
        val cache = InlineStateCache(mutableMapOf())

        cache.save("https://server.one", "state-one")

        Assert.assertEquals("state-one", cache.load("https://server.one"))
        Assert.assertEquals(0, cache.backingReads)
    }

    @Test
    fun cache_removeEvictsCachedState() {
        val backingStore = mutableMapOf("https://server.one" to "state-one")
        val cache = InlineStateCache(backingStore)

        Assert.assertEquals("state-one", cache.load("https://server.one"))
        cache.remove("https://server.one")

        Assert.assertNull(cache.load("https://server.one"))
        Assert.assertTrue(backingStore.isEmpty())
    }

    @Test
    fun cache_keepsServersIsolated() {
        val cache = InlineStateCache(
            mutableMapOf(
                "https://server.one" to "state-one",
                "https://server.two" to "state-two",
            ),
        )

        Assert.assertEquals("state-one", cache.load("https://server.one"))
        cache.remove("https://server.one")

        Assert.assertEquals("state-two", cache.load("https://server.two"))
    }
}
