package com.mattermost.networkclient

import com.facebook.react.bridge.ReadableMap
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class HeadersInterceptor(headers: ReadableMap) : Interceptor {

    private var headers: ReadableMap = headers;

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();
        val newRequest = request.newBuilder();

        val previousHeaders = request.headers.readableMap()

        // Add the previous and new headers, and proceed
        newRequest.addReadableMap(previousHeaders)
        newRequest.addReadableMap(this.headers);

        return chain.proceed(newRequest.build())
    }

}
