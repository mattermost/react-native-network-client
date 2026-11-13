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

    private data class NetworkSnapshot(
        val interfaceType: String,
        val ipAddress: String,
        val vpnActive: Boolean,
        val ssid: String,
    )

    /** Matches NetworkChangeDetector in SessionAttributesNetworkMonitor.kt. */
    private class NetworkChangeDetector {
        private var last: NetworkSnapshot? = null

        fun update(snapshot: NetworkSnapshot): Boolean {
            if (snapshot.interfaceType.isEmpty()) {
                return false
            }
            val previous = last
            last = snapshot
            return previous != null && previous != snapshot
        }
    }

    /**
     * Matches the network reset and server-value handling in SessionAttributesStore:
     * resetNetworkFields clears the network keys' sent time on enabled servers and bumps
     * networkGeneration, and setServerValues persists per-server values and clears the
     * union of previous and replacement server-value keys.
     */
    private class InlineNetworkState {
        class State(var enabled: Boolean, val lastSentAt: MutableMap<String, Long> = mutableMapOf())

        val states = mutableMapOf<String, State>()
        val backingServerValues = mutableMapOf<String, Map<String, String>>()
        private val serverValues = mutableMapOf<String, Map<String, String>>()
        var backingReads = 0
            private set
        var networkGeneration = 0L
            private set

        fun getServerValue(serverUrl: String, name: String): String? {
            val key = serverUrl.trimEnd('/')
            val cached = serverValues.getOrPut(key) {
                backingReads++
                backingServerValues[key] ?: emptyMap()
            }
            return cached[name]?.takeIf { it.isNotEmpty() }
        }

        fun resetNetworkFields(): List<String> {
            networkGeneration++
            return states.filterValues { it.enabled }.map { (serverUrl, state) ->
                NETWORK_KEYS.forEach { state.lastSentAt.remove(it) }
                serverUrl
            }
        }

        fun setServerValues(serverUrl: String, values: Map<String, String>) {
            val key = serverUrl.trimEnd('/')
            val previous = serverValues[key] ?: backingServerValues[key].orEmpty()
            val affectedKeys = previous.keys + values.keys
            serverValues[key] = values.toMap()
            if (values.isEmpty()) {
                backingServerValues.remove(key)
            } else {
                backingServerValues[key] = values.toMap()
            }
            val state = states[key]?.takeIf { it.enabled } ?: return
            affectedKeys.forEach { state.lastSentAt.remove(it) }
        }

        fun markSent(serverUrl: String, names: Collection<String>, sentAt: Long, generation: Long) {
            val state = states[serverUrl.trimEnd('/')]?.takeIf { it.enabled } ?: return
            val staleNetwork = generation != networkGeneration
            names.forEach { name ->
                if (!staleNetwork || name !in NETWORK_KEYS) {
                    state.lastSentAt[name] = sentAt
                }
            }
        }

        companion object {
            val NETWORK_KEYS = setOf("client_ip_address", "network_interface_type", "ssid", "vpn_active")
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

    // ---------------------------------------------------------------------------
    // Network change detection
    // ---------------------------------------------------------------------------

    private val officeWifi = NetworkSnapshot("wifi", "10.0.0.5", vpnActive = false, ssid = "office")

    @Test
    fun network_firstSnapshotIsOnlyABaseline() {
        Assert.assertFalse(NetworkChangeDetector().update(officeWifi))
    }

    @Test
    fun network_sameSnapshotIsNotAChange() {
        val detector = NetworkChangeDetector()
        detector.update(officeWifi)

        Assert.assertFalse(detector.update(officeWifi.copy()))
    }

    @Test
    fun network_anyNetworkAttributeChangeIsAChange() {
        val changes = listOf(
            officeWifi.copy(ssid = "home"),
            officeWifi.copy(ipAddress = "10.0.0.6"),
            officeWifi.copy(vpnActive = true, interfaceType = "vpn"),
            officeWifi.copy(interfaceType = "cellular", ssid = ""),
        )

        changes.forEach { changed ->
            val detector = NetworkChangeDetector()
            detector.update(officeWifi)
            Assert.assertTrue(detector.update(changed))
        }
    }

    @Test
    fun network_reconnectingToTheSameNetworkIsNotAChange() {
        val detector = NetworkChangeDetector()
        detector.update(officeWifi)

        Assert.assertFalse(detector.update(NetworkSnapshot("", "", vpnActive = false, ssid = "")))
        Assert.assertFalse(detector.update(officeWifi))
    }

    @Test
    fun network_resetClearsOnlyNetworkKeysOfEnabledServers() {
        val state = InlineNetworkState()
        state.states["https://enabled"] = InlineNetworkState.State(
            enabled = true,
            lastSentAt = mutableMapOf("ssid" to 1L, "vpn_active" to 1L, "os_version" to 1L),
        )
        state.states["https://disabled"] = InlineNetworkState.State(enabled = false)

        val serverUrls = state.resetNetworkFields()

        Assert.assertEquals(listOf("https://enabled"), serverUrls)
        Assert.assertEquals(mapOf("os_version" to 1L), state.states["https://enabled"]?.lastSentAt)
    }

    @Test
    fun network_headerBuiltBeforeAChangeDoesNotMarkNetworkKeysSent() {
        val state = InlineNetworkState()
        state.states["https://enabled"] = InlineNetworkState.State(enabled = true)
        val generation = state.networkGeneration

        state.resetNetworkFields()
        state.markSent("https://enabled", listOf("ssid", "os_version"), sentAt = 5L, generation = generation)

        Assert.assertEquals(mapOf("os_version" to 5L), state.states["https://enabled"]?.lastSentAt)
    }

    @Test
    fun serverValues_clearsTimestampsForAddedAndRemovedKeys() {
        val state = InlineNetworkState()
        state.states["https://enabled"] = InlineNetworkState.State(
            enabled = true,
            lastSentAt = mutableMapOf("biometric_authenticated" to 1L, "custom" to 1L, "os_version" to 1L),
        )

        state.setServerValues("https://enabled", mapOf("biometric_authenticated" to "true", "custom" to "v1"))
        state.states["https://enabled"]!!.lastSentAt["biometric_authenticated"] = 2L
        state.states["https://enabled"]!!.lastSentAt["custom"] = 2L

        // Omitting `custom` and later clearing with `{}` must invalidate removed keys too.
        state.setServerValues("https://enabled", mapOf("biometric_authenticated" to "true"))
        Assert.assertEquals(mapOf("os_version" to 1L), state.states["https://enabled"]?.lastSentAt)

        state.states["https://enabled"]!!.lastSentAt["biometric_authenticated"] = 3L
        state.setServerValues("https://enabled/", emptyMap())
        Assert.assertEquals(mapOf("os_version" to 1L), state.states["https://enabled"]?.lastSentAt)
    }

    @Test
    fun serverValues_persistsToBackingStoreAndCachesNegativeLookups() {
        val writer = InlineNetworkState()
        writer.setServerValues("https://one/", mapOf("biometric_authenticated" to "true"))

        // A second process (e.g. an app extension) restores persisted values from the shared store.
        val reader = InlineNetworkState()
        reader.backingServerValues.putAll(writer.backingServerValues)
        Assert.assertEquals("true", reader.getServerValue("https://one", "biometric_authenticated"))
        Assert.assertEquals(1, reader.backingReads)

        // Clearing removes the persisted entry and caches emptyMap() without re-reading disk.
        reader.setServerValues("https://one", emptyMap())
        Assert.assertTrue(reader.backingServerValues.isEmpty())
        Assert.assertNull(reader.getServerValue("https://one", "biometric_authenticated"))
        Assert.assertNull(reader.getServerValue("https://one", "biometric_authenticated"))
        Assert.assertEquals(1, reader.backingReads)
    }
}
