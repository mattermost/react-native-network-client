package com.mattermost.networkclient

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert
import org.junit.Test
import java.util.Locale

/**
 * Standalone test for CompressedResponseSizeInterceptor locale behavior.
 *
 * Reproduces MATTERMOST-MOBILE-ANDROID-AZ02: on Arabic-locale devices,
 * String.format() produces Arabic-Indic digits (U+0660 range) in the
 * X-Speed-Mbps header, which OkHttp rejects as invalid header characters.
 */
class CompressedResponseSizeInterceptorTest {

    companion object {
        /**
         * Lock to prevent parallel tests from racing on Locale.setDefault().
         * JVM locale is global state — concurrent mutation causes flaky tests.
         */
        private val LOCALE_LOCK = Any()
    }

    /**
     * Interceptor using the BROKEN locale-dependent formatting.
     * This is what the code did before the fix.
     */
    class BrokenInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val startTime = System.nanoTime()
            val response = chain.proceed(chain.request())
            val endTime = System.nanoTime()
            val elapsedTimeSeconds = (endTime - startTime) / 1_000_000_000.0
            val compressedSize = response.header("Content-Length")?.toLongOrNull() ?: 0L
            val speedMbps = if (elapsedTimeSeconds > 0 && compressedSize > 0) {
                (compressedSize * 8 / elapsedTimeSeconds) / 1_000_000.0
            } else {
                0.0
            }
            return response.newBuilder()
                .header("X-Speed-Mbps", "%.4f".format(speedMbps)) // locale-dependent!
                .build()
        }
    }

    /**
     * Interceptor using the FIXED locale-independent formatting.
     */
    class FixedInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val startTime = System.nanoTime()
            val response = chain.proceed(chain.request())
            val endTime = System.nanoTime()
            val elapsedTimeSeconds = (endTime - startTime) / 1_000_000_000.0
            val compressedSize = response.header("Content-Length")?.toLongOrNull() ?: 0L
            val speedMbps = if (elapsedTimeSeconds > 0 && compressedSize > 0) {
                (compressedSize * 8 / elapsedTimeSeconds) / 1_000_000.0
            } else {
                0.0
            }
            return response.newBuilder()
                .header("X-Speed-Mbps", String.format(Locale.US, "%.4f", speedMbps))
                .build()
        }
    }

    @Test
    fun brokenInterceptor_failsWithArabicLocale() {
        synchronized(LOCALE_LOCK) {
            val originalLocale = Locale.getDefault()
            try {
                // Set Arabic locale — causes String.format to use Arabic-Indic digits
                Locale.setDefault(Locale("ar"))

                MockWebServer().use { server ->
                    server.enqueue(MockResponse()
                        .setBody("hello")
                        .setHeader("Content-Length", "5"))
                    server.start()

                    val client = OkHttpClient.Builder()
                        .addInterceptor(BrokenInterceptor())
                        .build()

                    val request = Request.Builder()
                        .url(server.url("/test"))
                        .build()

                    // The broken interceptor produces Arabic-Indic digits in the header value.
                    // OkHttp's header validation rejects non-ASCII characters.
                    try {
                        client.newCall(request).execute().use { /* auto-close */ }
                        Assert.fail("Expected IllegalArgumentException from OkHttp header validation")
                    } catch (e: IllegalArgumentException) {
                        Assert.assertTrue(
                            "Expected error about unexpected char in header value",
                            e.message?.contains("Unexpected char") == true
                        )
                    }
                }
            } finally {
                Locale.setDefault(originalLocale)
            }
        }
    }

    @Test
    fun fixedInterceptor_succeedsWithArabicLocale() {
        synchronized(LOCALE_LOCK) {
            val originalLocale = Locale.getDefault()
            try {
                Locale.setDefault(Locale("ar"))

                MockWebServer().use { server ->
                    server.enqueue(MockResponse()
                        .setBody("hello")
                        .setHeader("Content-Length", "5"))
                    server.start()

                    val client = OkHttpClient.Builder()
                        .addInterceptor(FixedInterceptor())
                        .build()

                    val request = Request.Builder()
                        .url(server.url("/test"))
                        .build()

                    client.newCall(request).execute().use { response ->
                        // Should succeed without throwing
                        val speedHeader = response.header("X-Speed-Mbps")
                        Assert.assertNotNull("X-Speed-Mbps header should be present", speedHeader)

                        // Verify the value contains only ASCII characters
                        Assert.assertTrue(
                            "Header value should contain only ASCII: $speedHeader",
                            speedHeader!!.all { it.code in 0x20..0x7E }
                        )
                    }
                }
            } finally {
                Locale.setDefault(originalLocale)
            }
        }
    }

    @Test
    fun fixedInterceptor_succeedsWithUSLocale() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse()
                .setBody("hello")
                .setHeader("Content-Length", "5"))
            server.start()

            val client = OkHttpClient.Builder()
                .addInterceptor(FixedInterceptor())
                .build()

            val request = Request.Builder()
                .url(server.url("/test"))
                .build()

            client.newCall(request).execute().use { response ->
                val speedHeader = response.header("X-Speed-Mbps")
                Assert.assertNotNull(speedHeader)
                Assert.assertTrue(speedHeader!!.all { it.code in 0x20..0x7E })
            }
        }
    }
}
