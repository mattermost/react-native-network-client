package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.ApiClientModuleImpl
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class RCTClientRequestInterceptor : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        val client = ApiClientModuleImpl.getClientForRequest(request) ?:
            return chain.proceed(request)

        return client.adaptRCTRequest(request).execute()
    }
}
