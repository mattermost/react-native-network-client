package com.mattermost.networkclient.interceptors

import com.facebook.react.bridge.Arguments
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import java.io.IOException


/**
 * Response Auth Header Interceptor
 *
 * Grabs the given header value from a key, and attaches it to the session as a new header
 *
 * @param responseHeaderKey Header value to find
 * @param session
 */
class ResponseAuthHeaderInterceptor(private val responseHeaderKey: String, private val session: OkHttpClient.Builder) : Interceptor{

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request());
        var value = response.headers[responseHeaderKey]

        if(value != null){
            val authorizationHeader = Arguments.createMap();
            authorizationHeader.putString("Authorization", "Bearer $value")
            session.addNetworkInterceptor(HeadersInterceptor(authorizationHeader))
        }

        return response
    }
}
