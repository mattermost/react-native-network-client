package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.interfaces.RetryInterceptor

class LinearRetryInterceptor(
        override val retryLimit: Double,
        private val retryInterval: Double,
        override val retryStatusCodes: Set<Int>,
        override val retryMethods: Set<String>
) : RetryInterceptor {

    override fun getWaitInterval(attempts: Int): Long {
        return retryInterval.toLong()
    }
}
