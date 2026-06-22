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
    var networkType: String? = null,
    var compressedSize: Long = -1L,
    var requestStartNanos: Long = 0,
    var requestEndNanos: Long = 0,
) {
    fun getLatency() = TimeUnit.NANOSECONDS.toMillis(responseStartNanos - callStartNanos)
    fun getConnectionTime() = TimeUnit.NANOSECONDS.toMillis(connectEndNanos - connectStartNanos)
    fun getSpeedInMbps(): Double {
        val elapsedSeconds = (requestEndNanos - requestStartNanos) / 1_000_000_000.0
        return if (elapsedSeconds > 0 && compressedSize > 0) {
            (compressedSize * 8 / elapsedSeconds) / 1_000_000.0
        } else 0.0
    }
}
