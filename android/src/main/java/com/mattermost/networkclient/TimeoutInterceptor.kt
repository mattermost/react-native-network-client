package com.mattermost.networkclient

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

class TimeoutInterceptor(requestTimeout: Int?) : Interceptor {

    private var requestTimeout: Int = 10;

    init {
        if (requestTimeout != null) this.requestTimeout = requestTimeout
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();

        // Make a new chain; time out should be per-request
        val newChain = chain.withConnectTimeout(this.requestTimeout, TimeUnit.SECONDS).withReadTimeout(this.requestTimeout, TimeUnit.SECONDS)
        return newChain.proceed(request)
    }

}
