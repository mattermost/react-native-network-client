package com.mattermost.networkclient

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.util.concurrent.TimeUnit

/**
 * Parses the response data into the format expected by the App
 *
 * @return WriteableMap for passing back to App
 */
fun Response.returnAsWriteableMap(): WritableMap {
    val headers = Arguments.createMap();
    this.headers.forEach { k -> headers.putString(k.first, k.second) }

    val map = Arguments.createMap()
    map.putMap("headers", headers)
    map.putString("data", this.body!!.string())
    map.putInt("code", this.code)
    map.putBoolean("ok", this.isSuccessful)
    return map;
}

/**
 * Completes the response handling by calling a promise resolve / reject based on response type
 *
 * @param promise The promise to resolve/reject
 */
fun Response.promiseResolution(promise: Promise): Response {
    if (this.isSuccessful) {
        promise.resolve(this.returnAsWriteableMap());
    } else {
        promise.reject(this.code.toString(), this.returnAsWriteableMap())
    }
    return this
}

/**
 * Parses options passed in over the bridge for individual requests
 *
 * @param options ReadableMap of options from the App
 */
fun Request.Builder.parseOptions(options: ReadableMap, session: OkHttpClient.Builder): Request.Builder {
    val timeoutInterval = options.getInt("timeoutInterval");
    if(timeoutInterval > 0){
        session.addNetworkInterceptor(TimeoutInterceptor(timeoutInterval))
    }
    return this
}

/**
 * Parses options passed in over the bridge for client sessions
 *
 * @params options ReadableMap of options from the App
 */
fun OkHttpClient.Builder.parseOptions(options: ReadableMap): OkHttpClient.Builder {
    this.followRedirects(true);
    this.followSslRedirects(true);

    val followRedirects = options.getBoolean("followRedirects")
    if (followRedirects) {
        this.followRedirects(followRedirects)
        this.followSslRedirects(followRedirects)
    }

    // Retries
    val retryPolicyConfiguration = options.getMap("retryPolicyConfiguration");
    if (retryPolicyConfiguration != null) {
        val retryType = retryPolicyConfiguration.getString("type")
        val retryLimit = retryPolicyConfiguration.getDouble("retryLimit")
        val retryExponentialBackoffBase = retryPolicyConfiguration.getDouble("exponentialBackoffBase")
        val retryExponentialBackoffScale = retryPolicyConfiguration.getDouble("exponentialBackoffScale")
        this.addNetworkInterceptor(RetryInterceptor(retryType, retryLimit.toInt(), retryExponentialBackoffBase, retryExponentialBackoffScale))
    }

    // Connection timeout
    val timeoutIntervalForRequests = options.getInt("timeoutIntervalForRequest");
    if (timeoutIntervalForRequests > 0) {
        val duration = timeoutIntervalForRequests.toLong()
        this.connectTimeout(duration, TimeUnit.SECONDS)
    }

    // Connection read timeout
    val timeoutIntervalForResources = options.getInt("timeoutIntervalForResource");
    if (timeoutIntervalForResources > 0) {
        val duration = timeoutIntervalForResources.toLong()
        this.readTimeout(duration, TimeUnit.SECONDS)
    }

    return this
}

/**
 * Parses the header data into the format expected by the App
 *
 * @return WriteableMap for passing back to App
 */
fun Headers.readableMap(): ReadableMap {
    val headersMap = Arguments.createMap()
    this.forEach { (k, v) -> headersMap.putString(k, v) }
    return headersMap
}

/**
 * Adds the headers object passed in by the app to the request
 *
 * @options headers ReadableMap
 */
fun Request.Builder.addReadableMap(headers: ReadableMap): Request.Builder {
    for ((k, v) in headers.toHashMap()) {
        this.addHeader(k, v as String);
    }
    return this
}
