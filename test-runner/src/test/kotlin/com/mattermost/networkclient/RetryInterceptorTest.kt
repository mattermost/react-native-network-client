package com.mattermost.networkclient

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.SocketPolicy
import org.junit.Assert
import org.junit.Test
import org.mockito.Mockito.spy
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import java.io.IOException
import kotlin.math.pow

/**
 * Self-contained retry interceptor tests that run on the JVM without Android dependencies.
 *
 * The interceptor logic is reproduced inline here (matching
 * android/src/main/java/com/mattermost/networkclient/interfaces/RetryInterceptor.kt and
 * interceptors/ExponentialRetryInterceptor.kt) so these tests can run in the pure-JVM
 * test-runner without the Android SDK.
 */
class RetryInterceptorTest {

    // ---------------------------------------------------------------------------
    // Minimal inline implementations matching the real interceptors
    // ---------------------------------------------------------------------------

    abstract class RetryInterceptor(
        val retryLimit: Double,
        val retryMethods: Set<String>,
        val retryStatusCodes: Set<Int>,
    ) : Interceptor {

        abstract fun getWaitInterval(attempts: Int): Long

        open fun waitForMilliseconds(waitInterval: Long) {
            // No-op in tests — overridden by spy to track calls without actually sleeping
        }

        @Throws(IOException::class)
        override fun intercept(chain: Interceptor.Chain): Response {
            val request = chain.request()
            var attempts = 1
            var lastException: IOException? = null

            while (attempts <= retryLimit + 1) {
                try {
                    val response = chain.proceed(request)

                    if (!response.isSuccessful
                        && attempts <= retryLimit
                        && retryStatusCodes.contains(response.code)
                        && retryMethods.contains(request.method.uppercase())) {
                        runCatching { response.close() }
                        waitForMilliseconds(getWaitInterval(attempts))
                        attempts++
                        continue
                    }

                    return response
                } catch (e: IOException) {
                    if (attempts <= retryLimit && retryMethods.contains(request.method.uppercase())) {
                        lastException = e
                        waitForMilliseconds(getWaitInterval(attempts))
                        attempts++
                    } else {
                        throw e
                    }
                }
            }

            throw lastException!!
        }
    }

    open class ExponentialRetryInterceptor(
        retryLimit: Double,
        retryStatusCodes: Set<Int>,
        retryMethods: Set<String>,
        private val exponentialBackoffBase: Double = 2.0,
        private val exponentialBackoffScale: Double = 0.5,
    ) : RetryInterceptor(retryLimit, retryMethods, retryStatusCodes) {

        override fun getWaitInterval(attempts: Int): Long {
            val waitSeconds = exponentialBackoffBase.pow(attempts) * exponentialBackoffScale
            return (waitSeconds * 1000).toLong()
        }
    }

    // ---------------------------------------------------------------------------
    // HTTP status code retry tests
    // ---------------------------------------------------------------------------

    @Test
    fun exponentialRetry_retriesWithCorrectIntervals() {
        val retryInterceptor = spy(ExponentialRetryInterceptor(3.0, setOf(500), setOf("GET"), 2.0, 0.5))

        MockWebServer().use { server ->
            repeat(4) { server.enqueue(MockResponse().setResponseCode(500)) }
            server.start()

            val client = OkHttpClient().newBuilder().addInterceptor(retryInterceptor).build()
            val request = Request.Builder().url(server.url("/retry")).method("GET", null).build()

            client.newCall(request).execute()

            // base=2, scale=0.5: attempt 1→1s, 2→2s, 3→4s
            verify(retryInterceptor, times(1)).getWaitInterval(1)
            verify(retryInterceptor, times(1)).getWaitInterval(2)
            verify(retryInterceptor, times(1)).getWaitInterval(3)
            verify(retryInterceptor, times(1)).waitForMilliseconds(1000)
            verify(retryInterceptor, times(1)).waitForMilliseconds(2000)
            verify(retryInterceptor, times(1)).waitForMilliseconds(4000)
        }
    }

    @Test
    fun exponentialRetry_doesNotRetryExcludedStatusCode() {
        val retryInterceptor = spy(ExponentialRetryInterceptor(3.0, setOf(501), setOf("GET"), 1.2, 0.4))

        MockWebServer().use { server ->
            repeat(4) { server.enqueue(MockResponse().setResponseCode(500)) }
            server.start()

            val client = OkHttpClient().newBuilder().addInterceptor(retryInterceptor).build()
            val request = Request.Builder().url(server.url("/no_retry")).method("GET", null).build()

            client.newCall(request).execute()

            verify(retryInterceptor, times(0)).getWaitInterval(0)
            verify(retryInterceptor, times(0)).waitForMilliseconds(0)
        }
    }

    @Test
    fun exponentialRetry_doesNotRetryExcludedMethod() {
        val retryInterceptor = spy(ExponentialRetryInterceptor(3.0, setOf(500), setOf("POST"), 1.2, 0.4))

        MockWebServer().use { server ->
            repeat(4) { server.enqueue(MockResponse().setResponseCode(500)) }
            server.start()

            val client = OkHttpClient().newBuilder().addInterceptor(retryInterceptor).build()
            val request = Request.Builder().url(server.url("/no_retry_method")).method("GET", null).build()

            client.newCall(request).execute()

            verify(retryInterceptor, times(0)).getWaitInterval(0)
            verify(retryInterceptor, times(0)).waitForMilliseconds(0)
        }
    }

    // ---------------------------------------------------------------------------
    // IOException (poor network / packet loss) retry tests
    // ---------------------------------------------------------------------------

    @Test
    fun exponentialRetry_retriesOnConnectionReset() {
        val retryInterceptor = spy(ExponentialRetryInterceptor(3.0, setOf(500), setOf("GET"), 2.0, 0.5))

        MockWebServer().use { server ->
            // First 3 requests drop the connection (simulates packet loss / network reset)
            repeat(3) { server.enqueue(MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AFTER_REQUEST)) }
            // Final attempt succeeds
            server.enqueue(MockResponse().setResponseCode(200))
            server.start()

            val client = OkHttpClient().newBuilder().addInterceptor(retryInterceptor).build()
            val request = Request.Builder().url(server.url("/connection_reset")).method("GET", null).build()

            val response = client.newCall(request).execute()

            // base=2, scale=0.5: attempt 1→1s, 2→2s, 3→4s
            verify(retryInterceptor, times(1)).getWaitInterval(1)
            verify(retryInterceptor, times(1)).getWaitInterval(2)
            verify(retryInterceptor, times(1)).getWaitInterval(3)
            verify(retryInterceptor, times(1)).waitForMilliseconds(1000)
            verify(retryInterceptor, times(1)).waitForMilliseconds(2000)
            verify(retryInterceptor, times(1)).waitForMilliseconds(4000)
            Assert.assertTrue(response.isSuccessful)
        }
    }

    @Test
    fun exponentialRetry_throwsAfterExhaustingRetriesOnConnectionReset() {
        val retryInterceptor = spy(ExponentialRetryInterceptor(2.0, setOf(500), setOf("GET"), 2.0, 0.5))

        MockWebServer().use { server ->
            // All 3 requests drop the connection — exhausts the retry limit of 2
            repeat(3) { server.enqueue(MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AFTER_REQUEST)) }
            server.start()

            val client = OkHttpClient().newBuilder().addInterceptor(retryInterceptor).build()
            val request = Request.Builder().url(server.url("/exhausted")).method("GET", null).build()

            Assert.assertThrows(IOException::class.java) {
                client.newCall(request).execute()
            }

            // base=2, scale=0.5: attempt 1→1s, attempt 2→2s
            verify(retryInterceptor, times(1)).getWaitInterval(1)
            verify(retryInterceptor, times(1)).getWaitInterval(2)
            verify(retryInterceptor, times(1)).waitForMilliseconds(1000)
            verify(retryInterceptor, times(1)).waitForMilliseconds(2000)
        }
    }

    @Test
    fun exponentialRetry_doesNotRetryConnectionResetOnExcludedMethod() {
        val retryInterceptor = spy(ExponentialRetryInterceptor(3.0, setOf(500), setOf("GET"), 2.0, 0.5))

        MockWebServer().use { server ->
            server.enqueue(MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AFTER_REQUEST))
            server.start()

            val client = OkHttpClient().newBuilder().addInterceptor(retryInterceptor).build()
            // POST is not in retryMethods — should throw immediately without retrying
            val request = Request.Builder()
                .url(server.url("/no_retry_post"))
                .method("POST", "".toRequestBody())
                .build()

            Assert.assertThrows(IOException::class.java) {
                client.newCall(request).execute()
            }

            verify(retryInterceptor, times(0)).getWaitInterval(0)
            verify(retryInterceptor, times(0)).waitForMilliseconds(0)
        }
    }
}
