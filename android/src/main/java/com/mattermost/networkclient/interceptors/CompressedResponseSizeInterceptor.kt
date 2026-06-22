package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.helpers.CountingResponseBody
import com.mattermost.networkclient.metrics.MetricsEventFactory
import okhttp3.Interceptor
import okhttp3.Response

class CompressedResponseSizeInterceptor(private val metricsEventFactory: MetricsEventFactory?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val startTime = System.nanoTime()
        val response = chain.proceed(chain.request())

        val body = response.body ?: return response
        val metadata = metricsEventFactory?.getMetadata(chain.call())
            ?: return response  // no metrics tracking for this call, skip wrapping

        val expectedSize = response.header("Content-Length")?.toLongOrNull()

        metadata.requestStartNanos = startTime

        val countingBody = CountingResponseBody(body) { bytesRead ->
            metadata.compressedSize = expectedSize ?: bytesRead
            metadata.requestEndNanos = System.nanoTime()
        }

        return response.newBuilder().body(countingBody).build()
    }
}
