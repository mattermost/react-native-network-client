package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.SessionsObject
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.helpers.retriesExhausted
import com.mattermost.networkclient.interfaces.RetryConfig
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.math.pow

class RetryInterceptor(private val baseUrl: String) : Interceptor {

    private fun getRetryConfig(): RetryConfig {;
        val config: RetryConfig;

        // Check for request options
        if (SessionsObject.requestConfig[baseUrl]?.containsKey("retryRequest") == true) {
            config = SessionsObject.requestConfig[baseUrl]!!["retryRequest"] as RetryConfig;
            // Remove once set
            SessionsObject.requestConfig[baseUrl]!!.remove("retryRequest");
        } else if (SessionsObject.requestConfig[baseUrl]?.containsKey("retryClient") == true) {
            // Else check for client options
            config = SessionsObject.requestConfig[baseUrl]!!["retryClient"] as RetryConfig
        } else {
            // Else use defaults
            config = SessionsObject.DefaultRetry
        }

        return config;
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var response = chain.proceed(request)
        var attempts = 1;
        val config = getRetryConfig()

        // Keep retrying as long as response is not successful and less than the retry limit
        while (!response.isSuccessful && attempts <= config.retryLimit
                && config.retryStatusCodes.contains(response.code)
                && config.retryMethods.contains(request.method.toLowerCase())) {

            // End the request
            runCatching { response.close() }

            // Exponential or Linear (as else/default)
            val wait = when (config.retryType) {
                RetryTypes.EXPONENTIAL_RETRY -> calculateNextExponentialWait(attempts, config.retryExponentialBackOffBase, config.retryExponentialBackOffScale)
                else -> (config.retryInterval).toLong()
            }

            // Wait and increment our attempt
            TimeUnit.MILLISECONDS.sleep(wait)
            attempts++;

            // Try again!
            response = chain.proceed(request)
        }

        if (attempts >= config.retryLimit) {
            response.retriesExhausted = true
        }

        return response;
    }

    private fun calculateNextExponentialWait(attempts: Int, base: Double, scale: Double): Long {
        return (base.pow(attempts) * scale).toLong()
    }

}
