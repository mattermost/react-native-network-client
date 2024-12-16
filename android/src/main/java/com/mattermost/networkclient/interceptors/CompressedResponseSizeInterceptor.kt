package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody

class CompressedResponseSizeInterceptor: Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        // Record the start time
        val startTime = System.nanoTime()

        val response = chain.proceed(chain.request())

        // Record the end time
        val endTime = System.nanoTime()

        // Calculate elapsed time in seconds
        val elapsedTimeSeconds = (endTime - startTime) / 1_000_000_000.0

        val modifiedResponse = response.newBuilder()

        var compressedSize = response.header("Content-Length")?.toLongOrNull() ?: response.header("content-length")?.toLongOrNull()
        if (compressedSize == null) {
            val rawBytes = response.body?.byteStream()?.readBytes()
            compressedSize = rawBytes?.size?.toLong() ?: -1L
            modifiedResponse.body((rawBytes ?: ByteArray(0)).toResponseBody(response.body?.contentType()))
        }

        // Calculate speed in Mbps
        val speedMbps = if (elapsedTimeSeconds > 0 && compressedSize > 0) {
            (compressedSize * 8 / elapsedTimeSeconds) / 1_000_000.0
        } else {
            0.0
        }

        return modifiedResponse
            .header("X-Compressed-Size", compressedSize.toString())
            .header("X-Start-Time", startTime.toString())
            .header("X-End-Time", endTime.toString())
            .header("X-Speed-Mbps", "%.4f".format(speedMbps)) // Format to 4 decimal places
            .build()
    }
}
