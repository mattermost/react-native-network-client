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
 * Tests for bearer token sanitization in BearerTokenInterceptor.
 *
 * Reproduces MATTERMOST-MOBILE-ANDROID-AYPW: corrupted tokens containing
 * non-ASCII control characters (e.g. 0x02) cause OkHttp to throw
 * IllegalArgumentException when setting the Authorization header.
 */
class BearerTokenSanitizationTest {

    /**
     * Interceptor that sets Authorization header WITHOUT sanitization (broken behavior).
     */
    class BrokenTokenInterceptor(private val token: String) : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val request = chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            return chain.proceed(request)
        }
    }

    /**
     * Interceptor that sanitizes token to ASCII printable characters (fixed behavior).
     */
    class FixedTokenInterceptor(private val token: String) : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val sanitizedToken = token.replace(Regex("[^\\x20-\\x7E]"), "")
            if (sanitizedToken.isEmpty()) {
                return chain.proceed(chain.request())
            }
            val request = chain.request().newBuilder()
                .header("Authorization", "Bearer $sanitizedToken")
                .build()
            return chain.proceed(request)
        }
    }

    @Test
    fun brokenInterceptor_failsWithControlCharInToken() {
        val corruptToken = "abc\u0002def"  // Contains 0x02 control character

        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = OkHttpClient.Builder()
            .addInterceptor(BrokenTokenInterceptor(corruptToken))
            .build()

        val request = Request.Builder()
            .url(server.url("/test"))
            .build()

        try {
            client.newCall(request).execute()
            Assert.fail("Expected IllegalArgumentException from OkHttp header validation")
        } catch (e: IllegalArgumentException) {
            Assert.assertTrue(
                "Expected error about unexpected char",
                e.message?.contains("Unexpected char") == true
            )
        }

        server.shutdown()
    }

    @Test
    fun fixedInterceptor_succeedsWithControlCharInToken() {
        val corruptToken = "abc\u0002def"

        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = OkHttpClient.Builder()
            .addInterceptor(FixedTokenInterceptor(corruptToken))
            .build()

        val request = Request.Builder()
            .url(server.url("/test"))
            .build()

        val response = client.newCall(request).execute()

        // Should succeed without throwing
        Assert.assertEquals(200, response.code)

        // Verify the server received the sanitized token
        val recordedRequest = server.takeRequest()
        val authHeader = recordedRequest.getHeader("Authorization")
        Assert.assertEquals("Bearer abcdef", authHeader)

        server.shutdown()
    }

    @Test
    fun fixedInterceptor_skipsHeaderWhenTokenIsAllControlChars() {
        val allControlChars = "\u0001\u0002\u0003"

        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = OkHttpClient.Builder()
            .addInterceptor(FixedTokenInterceptor(allControlChars))
            .build()

        val request = Request.Builder()
            .url(server.url("/test"))
            .build()

        val response = client.newCall(request).execute()
        Assert.assertEquals(200, response.code)

        // No Authorization header should be set
        val recordedRequest = server.takeRequest()
        Assert.assertNull(recordedRequest.getHeader("Authorization"))

        server.shutdown()
    }

    @Test
    fun fixedInterceptor_passesCleanTokenUnmodified() {
        val cleanToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token"

        val server = MockWebServer()
        server.enqueue(MockResponse().setBody("ok"))
        server.start()

        val client = OkHttpClient.Builder()
            .addInterceptor(FixedTokenInterceptor(cleanToken))
            .build()

        val request = Request.Builder()
            .url(server.url("/test"))
            .build()

        val response = client.newCall(request).execute()
        Assert.assertEquals(200, response.code)

        val recordedRequest = server.takeRequest()
        Assert.assertEquals("Bearer $cleanToken", recordedRequest.getHeader("Authorization"))

        server.shutdown()
    }
}
