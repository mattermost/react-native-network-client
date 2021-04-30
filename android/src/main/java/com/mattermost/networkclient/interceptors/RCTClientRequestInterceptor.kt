package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.APIClientModule
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class RCTClientRequestInterceptor() : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        val client = APIClientModule.getClientForRequest(request) ?:
            return chain.proceed(request)

        return client.adaptRCTRequest(request).execute()
    }
}
