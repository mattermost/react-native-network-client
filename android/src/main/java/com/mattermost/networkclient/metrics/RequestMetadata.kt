package com.mattermost.networkclient.metrics

import java.util.concurrent.TimeUnit

data class RequestMetadata(
    var callStartNanos: Long = 0,
    var connectStartNanos: Long = 0,
    var connectEndNanos: Long = 0,
    var responseStartNanos: Long = 0,
    var isCached: Boolean = false,
    var sslVersion: String? = null,
    var sslCipher: String? = null,
    var httpVersion: String? = null,
    var networkType: String? = null
) {
    fun getLatency() = TimeUnit.NANOSECONDS.toMillis(responseStartNanos - callStartNanos)
    fun getConnectionTime() = TimeUnit.NANOSECONDS.toMillis(connectEndNanos - connectStartNanos)
}
