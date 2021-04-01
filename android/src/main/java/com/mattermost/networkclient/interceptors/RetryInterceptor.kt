package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.SessionsObject
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.math.pow

class RetryInterceptor() : Interceptor {

    private fun getRetryConfig(baseUrl: String): MutableMap<String, Any> {;
        val config: MutableMap<String, Any>;

        // Check for request options
        if (SessionsObject.config[baseUrl]?.containsKey("retryRequest") == true) {
            config = SessionsObject.config[baseUrl]!!["retryRequest"] as MutableMap<String, Any>;

            // Remove once set
            SessionsObject.config[baseUrl]!!.remove("retryRequest");
        // Else check for client options
        } else if (SessionsObject.config[baseUrl]?.containsKey("retryClient") == true) {
            config = SessionsObject.config[baseUrl]!!["retryClient"] as MutableMap<String, Any>
        // Else use defaults
        } else {
            config = SessionsObject.defaultRetry
        }

        return config;
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {

        val request = chain.request()
        var response = chain.proceed(request)
        var attempts = 0;
        val config = getRetryConfig(request.url.scheme + "://" + request.url.host + ":" + request.url.port )

        // Keep retrying as long as response is not successful and less than the retry limit
        while (!response.isSuccessful && attempts <= config["retryLimit"] as Double) {

            // End the request
            runCatching { response.close() }

            // Exponential or Linear (as else/default)
            val wait = when ((config["retryType"] as String?)?.toLowerCase(Locale.getDefault())) {
                "exponential" -> calculateNextExponentialWait(attempts, config["retryExponentialBackoffBase"] as Double, config["retryExponentialBackoffScale"] as Double)
                else -> (config["retryInterval"] as Double).toLong()
            }

            // Wait and increment our attempt
            TimeUnit.MILLISECONDS.sleep(wait)
            attempts++;

            // Try again!
            response = chain.proceed(request)
        }

        return response;
    }

    private fun calculateNextExponentialWait(attempts: Int, base: Double, scale: Double): Long {
        return (base.pow(attempts) * scale).toLong()
    }

}
