package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.interfaces.RetryInterceptor

class LinearRetryInterceptor(
        override val retryLimit: Double,
        override val retryStatusCodes: Set<Int>,
        override val retryMethods: Set<String>,
        private val retryInterval: Double,
) : RetryInterceptor {

    companion object {
        const val defaultRetryInterval = 2000.0
    }

    override fun getWaitInterval(attempts: Int): Long {
        return retryInterval.toLong()
    }
}
