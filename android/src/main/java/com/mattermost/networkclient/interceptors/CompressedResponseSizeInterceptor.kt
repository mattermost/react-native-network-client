package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody

class CompressedResponseSizeInterceptor: Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())

        val modifiedResponse = response.newBuilder()

        var compressedSize = response.header("Content-Length")?.toLongOrNull() ?: response.header("content-length")?.toLongOrNull()
        if (compressedSize == null) {
            val rawBytes = response.body?.byteStream()?.readBytes()
            compressedSize = rawBytes?.size?.toLong() ?: -1L
            modifiedResponse.body((rawBytes ?: ByteArray(0)).toResponseBody(response.body?.contentType()))
        }

        return modifiedResponse
            .header("X-Compressed-Size", compressedSize.toString())
            .build()
    }
}
