package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.math.pow

class RetryInterceptor(
        private val type: String? = "EXPONENTIAL",
        private val retryLimit: Int? = 10,
        private val retryInterval: Double? = 1.0,
        private val exponentialBackOffBase: Double? = 2.0,
        private val exponentialBackOffScale: Double? = 0.5
) : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var response = chain.proceed(request)
        var attempts = 0;

        // Keep retrying as long as response is not successful and less than the retry limit
        while (!response.isSuccessful && attempts <= this.retryLimit!!) {

            // End the request
            runCatching { response.close() }

            // Exponential or Linear (as else/default)
            val wait = when(type){
                "EXPONENTIAL" -> calculateNextExponentialWait(attempts)
                else -> retryInterval!!.toLong()
            }

            // Wait and increment our attempt
            TimeUnit.SECONDS.sleep(wait)
            attempts++;

            // Try again!
            response = chain.proceed(request)
        }

        return response;
    }

    private fun calculateNextExponentialWait(attempts: Int): Long {
        return (this.exponentialBackOffBase!!.pow(attempts) * this.exponentialBackOffScale!!).toLong()
    }

}
