package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.helpers.ProgressResponseBody
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class DownloadProgressInterceptor(private val taskId: String) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalResponse = chain.proceed(chain.request())
        val responseBuilder = originalResponse.newBuilder()
        val uncompressedHeaderName = "X-Uncompressed-Content-Length"
        var uncompressHeader = originalResponse.headers.get(uncompressedHeaderName.toLowerCase())
        if (uncompressHeader == null) {
            uncompressHeader = originalResponse.headers.get(uncompressedHeaderName)
        }

        var uncompressBytes: Long? = null
        if (uncompressHeader != null && uncompressHeader.isNotEmpty()) {
            uncompressBytes = uncompressHeader.toLongOrNull()
        }

        val downloadResponseBody = ProgressResponseBody(originalResponse.body!!, taskId, uncompressBytes)

        responseBuilder.body(downloadResponseBody)

        return responseBuilder.build()
    }
}
