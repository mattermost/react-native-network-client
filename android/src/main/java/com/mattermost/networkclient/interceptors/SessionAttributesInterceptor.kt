package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.sessionattributes.SessionAttributesConstants
import com.mattermost.networkclient.sessionattributes.SessionAttributesEngine
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class SessionAttributesInterceptor(private val serverUrl: String) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        val hasAuthorization = request.header("Authorization") != null
        val hasSessionAttributes = request.header(SessionAttributesConstants.HEADER_NAME) != null

        if (!hasAuthorization || hasSessionAttributes) {
            return chain.proceed(request)
        }

        val header = SessionAttributesEngine.getOutboundHeader(serverUrl)
            ?: return chain.proceed(request)

        val newRequest = request.newBuilder()
            .header(SessionAttributesConstants.HEADER_NAME, header)
            .build()

        return chain.proceed(newRequest)
    }
}
