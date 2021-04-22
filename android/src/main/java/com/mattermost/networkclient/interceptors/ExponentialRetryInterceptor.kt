package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.interfaces.RetryInterceptor
import kotlin.math.pow

class ExponentialRetryInterceptor(
        override val retryLimit: Double,
        override val retryStatusCodes: Set<Int>,
        override val retryMethods: Set<String>,
        private val exponentialBackoffBase: Double = 2.0,
        private val exponentialBackoffScale: Double = 0.5,
) : RetryInterceptor {

    companion object {
        const val defaultExponentialBackoffBase = 2.0
        const val defaultExponentialBackoffScale = 0.5
    }

    override fun getWaitInterval(attempts: Int): Long {
        return (exponentialBackoffBase.pow(attempts) * exponentialBackoffScale).toLong()
    }
}
