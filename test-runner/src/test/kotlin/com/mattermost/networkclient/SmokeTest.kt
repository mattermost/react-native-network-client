package com.mattermost.networkclient

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.Assert
import org.junit.Test

/**
 * Smoke test to verify the Kotlin test infrastructure works.
 * Uses MockWebServer to validate OkHttp interceptor test patterns.
 */
class SmokeTest {
    @Test
    fun mockWebServer_basicRequestResponse() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setBody("ok").setResponseCode(200))
            server.start()

            val client = OkHttpClient()
            val request = Request.Builder()
                .url(server.url("/test"))
                .build()

            client.newCall(request).execute().use { response ->
                Assert.assertEquals(200, response.code)
                Assert.assertEquals("ok", response.body?.string())
            }
        }
    }
}
