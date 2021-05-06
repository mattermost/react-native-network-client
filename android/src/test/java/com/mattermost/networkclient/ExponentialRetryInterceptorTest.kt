package com.mattermost.networkclient

import com.mattermost.networkclient.interceptors.ExponentialRetryInterceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.Assert
import org.junit.Test
import org.mockito.Mockito.*

class ExponentialRetryInterceptorTest {
    @Test
    fun exponentialRetryInterceptor_RetriesWithCorrectIntervals_1() {
        val retryLimit = 3.0
        val retryMethods = setOf("GET")
        val retryStatusCodes = setOf(500)
        val exponentialBackoffBase = 2.0
        val exponentialBackoffScale = 0.5
        val retryInterceptor = spy(ExponentialRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, exponentialBackoffBase, exponentialBackoffScale))

        val server = MockWebServer()
        for (i in 1..(retryLimit.toInt() + 1)) {
            server.enqueue(MockResponse().setResponseCode(500))
        }
        server.start()

        val baseUrl = server.url("/exponential_retry_test")
        val client = OkHttpClient().newBuilder()
                .addInterceptor(retryInterceptor)
                .build()

        val request = Request.Builder()
                .url(baseUrl)
                .method("GET", null)
                .build();

        val response = client.newCall(request).execute()

        verify(retryInterceptor, times(3)).getWaitInterval(anyInt())
        verify(retryInterceptor, times(1)).getWaitInterval(1)
        verify(retryInterceptor, times(1)).getWaitInterval(2)
        verify(retryInterceptor, times(1)).getWaitInterval(3)

        verify(retryInterceptor, times(3)).waitForMilliseconds(anyLong())
        verify(retryInterceptor, times(1)).waitForMilliseconds(1000)
        verify(retryInterceptor, times(1)).waitForMilliseconds(2000)
        verify(retryInterceptor, times(1)).waitForMilliseconds(4000)

        Assert.assertTrue(response.retriesExhausted!!)

        server.shutdown()
    }

    @Test
    fun exponentialRetryInterceptor_RetriesWithCorrectIntervals_2() {
        val retryLimit = 3.0
        val retryMethods = setOf("GET")
        val retryStatusCodes = setOf(500)
        val exponentialBackoffBase = 1.2
        val exponentialBackoffScale = 0.4
        val retryInterceptor = spy(ExponentialRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, exponentialBackoffBase, exponentialBackoffScale))

        val server = MockWebServer()
        for (i in 1..(retryLimit.toInt() + 1)) {
            server.enqueue(MockResponse().setResponseCode(500))
        }
        server.start()

        val baseUrl = server.url("/exponential_retry_test")
        val client = OkHttpClient().newBuilder()
                .addInterceptor(retryInterceptor)
                .build()

        val request = Request.Builder()
                .url(baseUrl)
                .method("GET", null)
                .build();

        val response = client.newCall(request).execute()

        verify(retryInterceptor, times(3)).getWaitInterval(anyInt())
        verify(retryInterceptor, times(1)).getWaitInterval(1)
        verify(retryInterceptor, times(1)).getWaitInterval(2)
        verify(retryInterceptor, times(1)).getWaitInterval(3)

        verify(retryInterceptor, times(3)).waitForMilliseconds(anyLong())
        verify(retryInterceptor, times(1)).waitForMilliseconds(480)
        verify(retryInterceptor, times(1)).waitForMilliseconds(576)
        verify(retryInterceptor, times(1)).waitForMilliseconds(691)

        Assert.assertTrue(response.retriesExhausted!!)

        server.shutdown()
    }

    @Test
    fun exponentialRetryInterceptor_DoesNotRetryExcludedStatusCode() {
        val retryLimit = 3.0
        val retryMethods = setOf("GET")
        val retryStatusCodes = setOf(501)
        val exponentialBackoffBase = 1.2
        val exponentialBackoffScale = 0.4
        val retryInterceptor = spy(ExponentialRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, exponentialBackoffBase, exponentialBackoffScale))

        val server = MockWebServer()
        for (i in 1..(retryLimit.toInt() + 1)) {
            server.enqueue(MockResponse().setResponseCode(500))
        }
        server.start()

        val baseUrl = server.url("/exponential_retry_test")
        val client = OkHttpClient().newBuilder()
                .addInterceptor(retryInterceptor)
                .build()

        val request = Request.Builder()
                .url(baseUrl)
                .method("GET", null)
                .build();

        val response = client.newCall(request).execute()

        verify(retryInterceptor, times(0)).getWaitInterval(anyInt())
        verify(retryInterceptor, times(0)).waitForMilliseconds(anyLong())

        Assert.assertNull(response.retriesExhausted)

        server.shutdown()
    }

    @Test
    fun exponentialRetryInterceptor_DoesNotRetryExcludedMethod() {
        val retryLimit = 3.0
        val retryMethods = setOf("POST")
        val retryStatusCodes = setOf(500)
        val exponentialBackoffBase = 1.2
        val exponentialBackoffScale = 0.4
        val retryInterceptor = spy(ExponentialRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, exponentialBackoffBase, exponentialBackoffScale))

        val server = MockWebServer()
        for (i in 1..(retryLimit.toInt() + 1)) {
            server.enqueue(MockResponse().setResponseCode(500))
        }
        server.start()

        val baseUrl = server.url("/exponential_retry_test")
        val client = OkHttpClient().newBuilder()
                .addInterceptor(retryInterceptor)
                .build()

        val request = Request.Builder()
                .url(baseUrl)
                .method("GET", null)
                .build();

        val response = client.newCall(request).execute()

        verify(retryInterceptor, times(0)).getWaitInterval(anyInt())
        verify(retryInterceptor, times(0)).waitForMilliseconds(anyLong())

        Assert.assertNull(response.retriesExhausted)

        server.shutdown()
    }
}
