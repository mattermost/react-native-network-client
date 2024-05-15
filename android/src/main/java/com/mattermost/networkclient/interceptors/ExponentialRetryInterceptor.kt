package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.interfaces.RetryInterceptor
import kotlin.math.pow

open class ExponentialRetryInterceptor(
        override val retryLimit: Double,
        override val retryStatusCodes: Set<Int>,
        override val retryMethods: Set<String>,
        private val exponentialBackoffBase: Double = 2.0,
        private val exponentialBackoffScale: Double = 0.5,
) : RetryInterceptor {

    companion object {
        const val DEFAULT_EXPONENTIAL_BACKOFF_BASE = 2.0
        const val DEFAULT_EXPONENTIAL_BACKOFF_SCALE = 0.5
    }

    override fun getWaitInterval(attempts: Int): Long {
        val waitSeconds = exponentialBackoffBase.pow(attempts) * exponentialBackoffScale
        return (waitSeconds * 1000).toLong()
    }
}
