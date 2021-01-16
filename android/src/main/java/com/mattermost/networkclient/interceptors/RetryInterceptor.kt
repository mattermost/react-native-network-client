package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.math.pow

class RetryInterceptor(
        _type: String?,
        _retryLimit: Int?,
        _exponentialBackOffBase: Double?,
        _exponentialBackOffScale: Double?
) : Interceptor {

    private val type = _type ?: "EXPONENTIAL";
    private val retryLimit = _retryLimit ?: 10;
    private val exponentialBackOffBase = _exponentialBackOffBase ?: 2.0
    private val exponentialBackOffScale = _exponentialBackOffScale ?: 0.5

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var response = chain.proceed(request)
        var attempts = 0;

        while (!response.isSuccessful && attempts <= this.retryLimit) {
            TimeUnit.SECONDS.sleep(calculateNextExponentialWait(attempts))
            attempts++;
            runCatching { response.close() }
            response = chain.proceed(request)
        }

        return response;
    }

    private fun calculateNextExponentialWait(attempts: Int): Long {
        return (this.exponentialBackOffBase.pow(attempts) * this.exponentialBackOffScale).toLong()
    }

}
