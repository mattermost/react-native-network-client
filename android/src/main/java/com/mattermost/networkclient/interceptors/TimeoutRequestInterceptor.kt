package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

class TimeoutRequestInterceptor(private var requestTimeout: Int) : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();

        // Make a new chain; time out should be per-request
        val newChain = chain.withConnectTimeout(this.requestTimeout, TimeUnit.MILLISECONDS).withReadTimeout(this.requestTimeout, TimeUnit.MILLISECONDS)
        return newChain.proceed(request)
    }

}
