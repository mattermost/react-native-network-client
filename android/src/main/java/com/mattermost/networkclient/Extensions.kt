package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.Headers
import okhttp3.Request
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.lang.Exception
import java.security.MessageDigest

var Response.retriesExhausted: Boolean? by NetworkClient.RequestRetriesExhausted

/**
 * Composes an array of redirect URLs from all prior responses
 *
 * @return WritableArray of HttpUrl strings
 */
fun Response.getRedirectUrls(): WritableArray? {
    if (priorResponse == null)
        return null

    val list = mutableListOf(request.url.toString())

    var originalResponse: Response? = priorResponse
    while (originalResponse != null) {
        list.add(0, originalResponse.request.url.toString())
        originalResponse = originalResponse.priorResponse
    }

    val redirectUrls = Arguments.createArray()
    list.forEach { redirectUrls.pushString(it) }

    return redirectUrls
}

/**
 * Parses the response data into the format expected by the App
 *
 * @return WriteableMap for passing back to App
 */
fun Response.toWritableMap(): WritableMap {
    val map = Arguments.createMap()
    map.putMap("headers", headers.toWritableMap())
    map.putInt("code", code)
    map.putBoolean("ok", isSuccessful)

    if (body !== null) {
        val bodyString = body!!.string()
        try {
            when (val json = JSONTokener(bodyString).nextValue()) {
                is JSONArray -> {
                    map.putArray("data", json.toWritableArray())
                }
                is JSONObject -> {
                    map.putMap("data", json.toWritableMap())
                }
                else -> {
                    map.putString("data", bodyString)
                }
            }
        } catch (_: Exception) {
            map.putString("data", bodyString)
        }
    }

    if (retriesExhausted != null) {
        map.putBoolean("retriesExhausted", retriesExhausted!!)
    }

    val redirectUrls = getRedirectUrls()
    if (redirectUrls != null) {
        map.putArray("redirectUrls", redirectUrls)
    }

    return map
}

fun Response.toDownloadMap(path: String): WritableMap {
    val map = Arguments.createMap()
    map.putMap("headers", headers.toWritableMap())
    map.putInt("code", code)
    map.putBoolean("ok", isSuccessful)
    val data = Arguments.createMap()
    data.putString("path", path)
    map.putMap("data", data)

    val redirectUrls = getRedirectUrls()
    if (redirectUrls != null) {
        map.putArray("redirectUrls", redirectUrls)
    }

    return map
}

/**
 * Parses headers passed in over the bridge for individual requests
 *
 * @param headers ReadableMap of headers from the App
 */
fun Request.Builder.applyHeaders(headers: ReadableMap?): Request.Builder {
    if (headers != null){
        for ((k, v) in headers.toHashMap()) {
            this.removeHeader(k)
            this.addHeader(k, v as String)
        }
    }

    return this
}

/**
 * Parses Headers into a WritableMap
 */
fun Headers.toWritableMap(): WritableMap {
    val writableMap = Arguments.createMap()
    var i = 0
    while (i < size) {
        writableMap.putString(name(i), value(i))
        i++
    }

    return writableMap
}

/**
 * Trims trailing slashes in the string
 */
fun String.trimTrailingSlashes(): String {
    return trimEnd { c -> c == '/' }
}

/**
 * Computes the SHA-256 hash of a string
 */
fun String.sha256(): String {
    return MessageDigest
            .getInstance("SHA-256")
            .digest(toByteArray())
            .fold("", { str, it -> str + "%02x".format(it) })
}

/**
 * Converts a JSONObject to a WritableMap
 */
fun JSONObject.toWritableMap(): WritableMap {
    val map = Arguments.createMap()
    val iterator = keys()
    while (iterator.hasNext()) {
        val key = iterator.next()
        when (val value = this[key]) {
            is JSONObject -> {
                map.putMap(key, value.toWritableMap())
            }
            is JSONArray -> {
                map.putArray(key, value.toWritableArray())
            }
            is Boolean -> {
                map.putBoolean(key, value)
            }
            is Int -> {
                map.putInt(key, value)
            }
            is Double -> {
                map.putDouble(key, value)
            }
            is Long -> {
                map.putDouble(key, value.toDouble())
            }
            is String -> {
                map.putString(key, value)
            }
            else -> {
                if (value.equals(JSONObject.NULL)) {
                    map.putNull(key);
                } else {
                    map.putString(key, value.toString())
                }
            }
        }
    }

    return map
}

/**
 * Converts a JSONArray to a WritableArray
 */
fun JSONArray.toWritableArray(): WritableArray {
    val array = Arguments.createArray()
    for (i in 0 until length()) {
        when (val value = this[i]) {
            is JSONObject -> {
                array.pushMap(value.toWritableMap())
            }
            is JSONArray -> {
                array.pushArray(value.toWritableArray())
            }
            is Boolean -> {
                array.pushBoolean(value)
            }
            is Int -> {
                array.pushInt(value)
            }
            is Double -> {
                array.pushDouble(value)
            }
            is Long -> {
                array.pushDouble(value.toDouble())
            }
            is String -> {
                array.pushString(value)
            }
            else -> {
                if (value.equals(JSONObject.NULL)) {
                    array.pushNull()
                } else {
                    array.pushString(value.toString())
                }
            }
        }
    }
    return array
}
