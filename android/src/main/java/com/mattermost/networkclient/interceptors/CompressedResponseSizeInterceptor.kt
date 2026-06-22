package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.helpers.CountingResponseBody
import com.mattermost.networkclient.metrics.MetricsEventFactory
import okhttp3.Interceptor
import okhttp3.Response

class CompressedResponseSizeInterceptor(private val metricsEventFactory: MetricsEventFactory?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val startTime = System.nanoTime()
        val response = chain.proceed(chain.request())
        val endTime = System.nanoTime()

        val compressedSize = response.header("Content-Length")?.toLongOrNull()
            ?: response.header("content-length")?.toLongOrNull()

        if (compressedSize != null) {
            val metadata = metricsEventFactory?.getMetadata(chain.call())
            metadata?.compressedSize = compressedSize
            metadata?.requestStartNanos = startTime
            metadata?.requestEndNanos = endTime
            return response
        }

        val body = response.body ?: return response
        val call = chain.call()

        val countingBody = CountingResponseBody(body) { bytesRead ->
            val metadata = metricsEventFactory?.getMetadata(call)
            metadata?.compressedSize = bytesRead
            metadata?.requestStartNanos = startTime
            metadata?.requestEndNanos = System.nanoTime()
        }

        return response.newBuilder().body(countingBody).build()
    }
}
