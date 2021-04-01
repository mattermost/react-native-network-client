package com.mattermost.networkclient

import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.Request

object SessionsObject {
    var client = mutableMapOf<String, OkHttpClient.Builder>()
    var request = mutableMapOf<String, Request.Builder>()
    var call = mutableMapOf<String, Call>()
    var config = mutableMapOf<String, HashMap<String, Any>>()

    // Default Retry Config
    val defaultRetry = mutableMapOf<String, Any>(
            Pair("retryType", "linear"),
            Pair("retryLimit", 5.0),
            Pair("retryInterval", 500.0),
            Pair("exponentialBackOffBase", 2.0),
            Pair("exponentialBackOffScale", 0.5)
    )
}

