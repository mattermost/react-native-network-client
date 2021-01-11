package com.mattermost.networkclient

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.math.pow


class RetryInterceptor(type: String?, retryLimit: Int?, exponentialBackOffBase: Double?, exponentialBackOffScale: Double?) : Interceptor {

    private var type: String = "EXPONENTIAL"
    private var retryLimit: Int = 10
    private var exponentialBackOffBase: Double = 2.0
    private var exponentialBackOffScale: Double = 0.5

    init {
        if (type != null) this.type = type
        if (retryLimit != null) this.retryLimit = retryLimit
        if (exponentialBackOffBase != null) this.exponentialBackOffBase = exponentialBackOffBase
        if (exponentialBackOffScale != null) this.exponentialBackOffScale = exponentialBackOffScale
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();
        var response = chain.proceed(request)
        var attempts: Int = 1

        while (attempts < this.retryLimit && !response.isSuccessful) {
            attempts += 1;
            TimeUnit.MILLISECONDS.sleep(calculateNextExponentialWait(attempts))
            response = chain.proceed(request)
        }

        return response;
    }

    private fun calculateNextExponentialWait(attempts: Int): Long {
        return (this.exponentialBackOffBase.pow(attempts) * this.exponentialBackOffScale).toLong()
    }

}
