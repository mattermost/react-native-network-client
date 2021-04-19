package com.mattermost.networkclient

import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.interfaces.RetryConfig
import com.mattermost.networkclient.interfaces.TimeoutConfig
import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.WebSocket

object SessionsObject {
    var client = mutableMapOf<String, OkHttpClient.Builder>()
    var call = mutableMapOf<String, Call>()

    /**
     * SessionsObject.requestConfig[url] = HashMap<String, Any>
     *     HashMap<String, Any> =
     *     <"clientHeaders", ReadableMap>,
     *     <"retryRequest", RetryConfig>,
     *     <"retryClient", RetryConfig>,
     *     <"retriesExhausted", boolean>
     *     <"requestTimeout", TimeoutConfig>
     *     <"clientTimeout", TimeoutConfig>
     */
    var requestConfig = mutableMapOf<String, HashMap<String, Any>>()
    var socket = mutableMapOf<String, WebSocket>()

    // Default Retry Config
    object DefaultRetry: RetryConfig {
        override val retryType = RetryTypes.LINEAR_RETRY
        override val retryLimit = 5.0
        override val retryInterval  = 500.0
        override val retryExponentialBackOffBase = 2.0
        override val retryExponentialBackOffScale = 0.5
        override val retryStatusCodes =  setOf(408, 500, 502, 503, 504)
        override val retryMethods = setOf("get", "post", "put", "patch", "delete")
    }

    object DefaultTimeout: TimeoutConfig {
        override var read = 300.0
        override var write = 300.0
    }

}

