package com.mattermost.networkclient.interceptors

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

class TimeoutInterceptor(private val readTimeout: Int, private val writeTimeout: Int) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();

        // Test:
        // Request 1 with timeout interceptor logs here
        // Request 2 without timeout interceptor does not log here
        Log.d("=================", "In timeout interceptor")
        return chain
                .withConnectTimeout(readTimeout, TimeUnit.MILLISECONDS)
                .withReadTimeout(readTimeout, TimeUnit.MILLISECONDS)
                .withWriteTimeout(writeTimeout, TimeUnit.MILLISECONDS)
                .proceed(request)
    }

}
