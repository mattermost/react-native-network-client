package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.helpers.ProgressResponseBody
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.Locale

class DownloadProgressInterceptor(private val taskId: String) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalResponse = chain.proceed(chain.request())
        val responseBuilder = originalResponse.newBuilder()
        val uncompressedHeaderName = "X-Uncompressed-Content-Length"
        var uncompressHeader = originalResponse.headers[uncompressedHeaderName.lowercase(Locale.getDefault())]
        if (uncompressHeader == null) {
            uncompressHeader = originalResponse.headers[uncompressedHeaderName]
        }

        var uncompressBytes: Long? = null
        if (!uncompressHeader.isNullOrEmpty()) {
            uncompressBytes = uncompressHeader.toLongOrNull()
        }

        val downloadResponseBody = ProgressResponseBody(originalResponse.body!!, taskId, uncompressBytes)

        responseBuilder.body(downloadResponseBody)

        return responseBuilder.build()
    }
}
