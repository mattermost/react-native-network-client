package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.math.pow

class RetryInterceptor(
        private var type: String?,
        private var retryLimit: Int?,
        private var retryInterval: Double?,
        private var exponentialBackOffBase: Double?,
        private var exponentialBackOffScale: Double?
) : Interceptor {

    init {
        if (type == null) type = "EXPONENTIAL"
        if (retryLimit == null) retryLimit = 10
        if (retryInterval == null) retryInterval = 2.0
        // Convert to Seconds from milliseconds
        if (retryInterval!! > 60) retryInterval = retryInterval!! / 1000
        if (exponentialBackOffBase == null) exponentialBackOffBase = 2.0
        if (exponentialBackOffScale == null) exponentialBackOffScale = 0.5
    }

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
            val wait = when (type!!.toLowerCase(Locale.getDefault())) {
                "exponential" -> calculateNextExponentialWait(attempts)
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
