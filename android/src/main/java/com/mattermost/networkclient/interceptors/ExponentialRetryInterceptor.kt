package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.interfaces.RetryInterceptor
import kotlin.math.pow

class ExponentialRetryInterceptor(
        override val retryLimit: Double,
        private val exponentialBackOffBase: Double,
        private val exponentialBackOffScale: Double,
        override val retryStatusCodes: Set<Int>,
        override val retryMethods: Set<String>
) : RetryInterceptor {

    override fun getWaitInterval(attempts: Int): Long {
        return (exponentialBackOffBase.pow(attempts) * exponentialBackOffScale).toLong()
    }
}
