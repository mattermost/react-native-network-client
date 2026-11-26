package com.mattermost.networkclient

import com.mattermost.networkclient.interceptors.BearerTokenInterceptor
import com.mattermost.networkclient.interceptors.TokenStore
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class BearerTokenInterceptorTest {

    private class RecordingTokenStore(initial: String? = null, private val beforeStore: () -> Unit = {}) : TokenStore {
        @Volatile
        var value: String? = initial
        private val writeCount = AtomicInteger()
        val writes: Int get() = writeCount.get()

        override fun retrieve(alias: String): String? = value

        override fun store(value: String, alias: String) {
            beforeStore()
            this.value = value
            writeCount.incrementAndGet()
        }

        override fun delete(alias: String) {
            value = null
        }
    }

    private val alias = "server-TOKEN"
    private lateinit var server: MockWebServer

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    private fun execute(
        store: TokenStore,
        authorization: String? = null,
        response: MockResponse = MockResponse(),
        interceptor: BearerTokenInterceptor = BearerTokenInterceptor(alias, "token", store),
    ): String? {
        server.enqueue(response)
        val client = OkHttpClient.Builder()
            .addInterceptor(interceptor)
            .build()
        val request = Request.Builder().url(server.url("/api/v4/users/me")).apply {
            authorization?.let { header("Authorization", it) }
        }.build()
        client.newCall(request).execute().close()
        return server.takeRequest().getHeader("Authorization")
    }

    @Test
    fun storesTheCallersBearerTokenWhenNoneIsStored() {
        val store = RecordingTokenStore()

        val sent = execute(store, authorization = "Bearer sso-token")

        assertEquals("Bearer sso-token", sent)
        assertEquals("sso-token", store.value)
        assertEquals(1, store.writes)
    }

    @Test
    fun keepsTheCallersTokenOverAStaleStoredOne() {
        val store = RecordingTokenStore(initial = "stale-token")

        val sent = execute(store, authorization = "Bearer current-token")

        assertEquals("Bearer current-token", sent)
        assertEquals("current-token", store.value)
    }

    @Test
    fun doesNotRewriteAnUnchangedToken() {
        val store = RecordingTokenStore(initial = "same-token")

        execute(store, authorization = "Bearer same-token")

        assertEquals(0, store.writes)
    }

    @Test
    fun addsTheStoredTokenWhenTheCallerSendsNone() {
        val store = RecordingTokenStore(initial = "stored-token")

        val sent = execute(store)

        assertEquals("Bearer stored-token", sent)
        assertEquals(0, store.writes)
    }

    @Test
    fun sendsNoAuthorizationWithoutAnyToken() {
        val store = RecordingTokenStore()

        val sent = execute(store)

        assertNull(sent)
        assertNull(store.value)
    }

    @Test
    fun ignoresNonBearerAuthorization() {
        val store = RecordingTokenStore()

        val sent = execute(store, authorization = "Token oauth-token")

        assertEquals("Token oauth-token", sent)
        assertNull(store.value)
    }

    @Test
    fun storesTheTokenFromTheResponseHeader() {
        val store = RecordingTokenStore()

        execute(store, response = MockResponse().addHeader("Token", "login-token"))

        assertEquals("login-token", store.value)
    }

    @Test
    fun storesTheCallersTokenWhenTheSchemeIsUpperCase() {
        val store = RecordingTokenStore()

        val sent = execute(store, authorization = "BEARER sso-token")

        assertEquals("BEARER sso-token", sent)
        assertEquals("sso-token", store.value)
    }

    @Test
    fun invalidateDeletesTheStoredToken() {
        val store = RecordingTokenStore(initial = "stored-token")
        val interceptor = BearerTokenInterceptor(alias, "token", store)

        interceptor.invalidate()

        assertNull(store.value)
    }

    @Test
    fun doesNotStoreTheCallersTokenAfterInvalidation() {
        val store = RecordingTokenStore()
        val interceptor = BearerTokenInterceptor(alias, "token", store)
        interceptor.invalidate()

        val sent = execute(store, authorization = "Bearer late-token", interceptor = interceptor)

        assertEquals("Bearer late-token", sent)
        assertNull(store.value)
        assertEquals(0, store.writes)
    }

    @Test
    fun doesNotStoreTheResponseTokenAfterInvalidation() {
        val store = RecordingTokenStore()
        val interceptor = BearerTokenInterceptor(alias, "token", store)
        interceptor.invalidate()

        execute(store, response = MockResponse().addHeader("Token", "late-token"), interceptor = interceptor)

        assertNull(store.value)
    }

    @Test
    fun anInFlightRequestCannotRestoreTheTokenAfterInvalidation() {
        val storing = CountDownLatch(1)
        val releaseStore = CountDownLatch(1)
        val store = RecordingTokenStore(beforeStore = {
            storing.countDown()
            releaseStore.await(5, TimeUnit.SECONDS)
        })
        val interceptor = BearerTokenInterceptor(alias, "token", store)

        val request = Thread { execute(store, authorization = "Bearer in-flight-token", interceptor = interceptor) }.apply { start() }
        storing.await(5, TimeUnit.SECONDS)
        val logout = Thread { interceptor.invalidate() }.apply { start() }
        logout.join(100)
        releaseStore.countDown()
        request.join()
        logout.join()

        assertNull(store.value)
    }

    @Test
    fun concurrentRequestsWithTheSameNewTokenStoreItOnce() {
        val store = RecordingTokenStore(beforeStore = { Thread.sleep(20) })
        val client = OkHttpClient.Builder()
            .addInterceptor(BearerTokenInterceptor(alias, "token", store))
            .build()
        val threads = 16
        repeat(threads) { server.enqueue(MockResponse()) }
        val pool = Executors.newFixedThreadPool(threads)
        val start = CountDownLatch(1)

        val futures = (1..threads).map {
            pool.submit {
                start.await()
                val request = Request.Builder()
                    .url(server.url("/api/v4/users/me"))
                    .header("Authorization", "BEARER sso-token")
                    .build()
                client.newCall(request).execute().close()
            }
        }
        start.countDown()
        try {
            futures.forEach { it.get(30, TimeUnit.SECONDS) }
        } finally {
            pool.shutdownNow()
        }

        assertEquals("sso-token", store.value)
        assertEquals(1, store.writes)
    }
}
