package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

class TimeoutInterceptor(
        private val readTimeout: Int,
        private val writeTimeout: Int
) : Interceptor {
    companion object {
        const val defaultReadTimeout = 30000
        const val defaultWriteTimeout = 30000
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();

        val newChain = chain
                .withConnectTimeout(readTimeout, TimeUnit.MILLISECONDS)
                .withReadTimeout(readTimeout, TimeUnit.MILLISECONDS)
                .withWriteTimeout(writeTimeout, TimeUnit.MILLISECONDS)

        return newChain.proceed(request)
    }

}
