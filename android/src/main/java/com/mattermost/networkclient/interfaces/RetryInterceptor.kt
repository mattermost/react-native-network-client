package com.mattermost.networkclient.interfaces

import com.mattermost.networkclient.retriesExhausted
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

interface RetryInterceptor : Interceptor {
    val retryLimit: Double
    val retryMethods: Set<String>
    val retryStatusCodes: Set<Int>

    companion object {
        const val DEFAULT_RETRY_LIMIT = 2.0
        val defaultRetryStatusCodes = setOf(408, 500, 502, 503, 504)
        val defaultRetryMethods = setOf("GET", "PATCH", "POST", "PUT", "DELETE")
    }

    fun getWaitInterval(attempts: Int): Long

    fun waitForMilliseconds(waitInterval: Long) {
        TimeUnit.MILLISECONDS.sleep(waitInterval)
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var attempts = 1
        var lastException: IOException? = null

        while (attempts <= retryLimit + 1) {
            try {
                val response = chain.proceed(request)

                if (!response.isSuccessful
                        && attempts <= retryLimit
                        && retryStatusCodes.contains(response.code)
                        && retryMethods.contains(request.method.uppercase())) {
                    runCatching { response.close() }
                    waitForMilliseconds(getWaitInterval(attempts))
                    attempts++
                    continue
                }

                if (!response.isSuccessful && attempts > retryLimit) {
                    response.retriesExhausted = true
                }

                return response
            } catch (e: IOException) {
                if (attempts <= retryLimit && retryMethods.contains(request.method.uppercase())) {
                    lastException = e
                    waitForMilliseconds(getWaitInterval(attempts))
                    attempts++
                } else {
                    throw e
                }
            }
        }

        throw lastException!!
    }
}
