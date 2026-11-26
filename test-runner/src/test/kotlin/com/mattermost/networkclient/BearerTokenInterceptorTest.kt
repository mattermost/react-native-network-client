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

class BearerTokenInterceptorTest {

    private class RecordingTokenStore(initial: String? = null) : TokenStore {
        var value: String? = initial
        var writes = 0

        override fun retrieve(alias: String): String? = value

        override fun store(value: String, alias: String) {
            this.value = value
            writes++
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

    private fun execute(store: TokenStore, authorization: String? = null, response: MockResponse = MockResponse()): String? {
        server.enqueue(response)
        val client = OkHttpClient.Builder()
            .addInterceptor(BearerTokenInterceptor(alias, "token", store))
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
}
