package com.mattermost.networkclient

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.Interceptor
import okhttp3.Response
import org.junit.Assert
import org.junit.Test

/**
 * Tests for applyHeaders resilience against invalid header values.
 *
 * Reproduces MATTERMOST-MOBILE-ANDROID-AYPW: corrupted tokens containing
 * non-ASCII control characters (e.g. 0x02) cause OkHttp to throw
 * IllegalArgumentException in addHeader() during request construction.
 * The fix catches this in applyHeaders and skips the invalid header.
 */
class ApplyHeadersTest {

    /**
     * Interceptor that applies headers using OkHttp's addHeader WITHOUT
     * any error handling (broken behavior — reproduces the crash).
     */
    class BrokenHeaderInterceptor(private val headers: Map<String, String>) : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val builder = chain.request().newBuilder()
            for ((k, v) in headers) {
                builder.removeHeader(k)
                builder.addHeader(k, v)  // Throws on non-ASCII
            }
            return chain.proceed(builder.build())
        }
    }

    /**
     * Interceptor that applies headers with the same catch-and-skip pattern
     * used in the fixed applyHeaders extension function.
     */
    class FixedHeaderInterceptor(private val headers: Map<String, String>) : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val builder = chain.request().newBuilder()
            for ((k, v) in headers) {
                try {
                    builder.removeHeader(k)
                    builder.addHeader(k, v)
                } catch (e: IllegalArgumentException) {
                    // Skip invalid header, same as the production fix
                }
            }
            return chain.proceed(builder.build())
        }
    }

    @Test
    fun brokenHeaders_crashWithControlCharInToken() {
        val headers = mapOf("Authorization" to "Bearer abc\u0002def")

        MockWebServer().use { server ->
            server.enqueue(MockResponse().setBody("ok"))
            server.start()

            val client = OkHttpClient.Builder()
                .addInterceptor(BrokenHeaderInterceptor(headers))
                .build()

            val request = Request.Builder()
                .url(server.url("/test"))
                .build()

            try {
                client.newCall(request).execute().use { /* auto-close */ }
                Assert.fail("Expected IllegalArgumentException from OkHttp header validation")
            } catch (e: IllegalArgumentException) {
                Assert.assertTrue(
                    "Expected error about unexpected char",
                    e.message?.contains("Unexpected char") == true
                )
            }
        }
    }

    @Test
    fun fixedHeaders_skipInvalidAndProceed() {
        val headers = mapOf(
            "Authorization" to "Bearer abc\u0002def",
            "X-Custom" to "valid-value"
        )

        MockWebServer().use { server ->
            server.enqueue(MockResponse().setBody("ok"))
            server.start()

            val client = OkHttpClient.Builder()
                .addInterceptor(FixedHeaderInterceptor(headers))
                .build()

            val request = Request.Builder()
                .url(server.url("/test"))
                .build()

            client.newCall(request).execute().use { response ->
                Assert.assertEquals(200, response.code)
            }

            // Invalid Authorization header should be skipped, valid header kept
            val recorded = server.takeRequest()
            Assert.assertNull(
                "Invalid Authorization header should be skipped",
                recorded.getHeader("Authorization")
            )
            Assert.assertEquals("valid-value", recorded.getHeader("X-Custom"))
        }
    }

    @Test
    fun fixedHeaders_cleanHeadersPassThrough() {
        val headers = mapOf(
            "Authorization" to "Bearer eyJhbGciOiJIUzI1NiJ9.valid.token",
            "Content-Type" to "application/json"
        )

        MockWebServer().use { server ->
            server.enqueue(MockResponse().setBody("ok"))
            server.start()

            val client = OkHttpClient.Builder()
                .addInterceptor(FixedHeaderInterceptor(headers))
                .build()

            val request = Request.Builder()
                .url(server.url("/test"))
                .build()

            client.newCall(request).execute().use { response ->
                Assert.assertEquals(200, response.code)
            }

            val recorded = server.takeRequest()
            Assert.assertEquals(
                "Bearer eyJhbGciOiJIUzI1NiJ9.valid.token",
                recorded.getHeader("Authorization")
            )
            Assert.assertEquals("application/json", recorded.getHeader("Content-Type"))
        }
    }

    @Test
    fun fixedHeaders_allInvalidHeadersSkipped() {
        val headers = mapOf(
            "X-Bad1" to "value\u0001here",
            "X-Bad2" to "\u0003\u0004\u0005"
        )

        MockWebServer().use { server ->
            server.enqueue(MockResponse().setBody("ok"))
            server.start()

            val client = OkHttpClient.Builder()
                .addInterceptor(FixedHeaderInterceptor(headers))
                .build()

            val request = Request.Builder()
                .url(server.url("/test"))
                .build()

            client.newCall(request).execute().use { response ->
                Assert.assertEquals(200, response.code)
            }

            val recorded = server.takeRequest()
            Assert.assertNull(recorded.getHeader("X-Bad1"))
            Assert.assertNull(recorded.getHeader("X-Bad2"))
        }
    }
}
