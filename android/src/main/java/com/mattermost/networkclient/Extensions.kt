package com.mattermost.networkclient

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import okhttp3.Request
import okhttp3.Response
import java.math.BigInteger
import java.security.MessageDigest

var Response.retriesExhausted: Boolean? by NetworkClient.RequestRetriesExhausted

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
    map.putString("lastRequestedUrl", this.request.url.toString())

    if (this.retriesExhausted != null) {
        map.putBoolean("retriesExhausted", this.retriesExhausted!!)
    }

    return map;
}

/**
 * Parses headers passed in over the bridge for individual requests
 *
 * @param headers ReadableMap of headers from the App
 */
fun Request.Builder.applyHeaders(headers: ReadableMap?): Request.Builder {
    if (headers != null){
        for ((k, v) in headers.toHashMap()) {
            this.removeHeader(k);
            this.addHeader(k, v as String);
        }
    }

    return this;
}

/**
 * Computes the MD5 of a string
 */
fun String.md5(): String {
    val md = MessageDigest.getInstance("MD5")
    return BigInteger(1, md.digest(toByteArray()))
            .toString(16)
            .padStart(32, '0')
}
