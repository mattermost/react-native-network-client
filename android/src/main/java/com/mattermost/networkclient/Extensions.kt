package com.mattermost.networkclient

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.mattermost.networkclient.metrics.RequestMetadata
import okhttp3.Headers
import okhttp3.Request
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.io.FilterInputStream
import java.io.IOException
import java.io.InputStream
import java.io.InputStreamReader
import java.security.MessageDigest
import java.nio.charset.StandardCharsets


var Response.retriesExhausted: Boolean? by NetworkClient.RequestRetriesExhausted

/**
 * Wraps an InputStream and counts the bytes read through it. Used to compute the
 * uncompressed body size for the metrics payload without buffering the body up front.
 */
private class CountingInputStream(stream: InputStream) : FilterInputStream(stream) {
    var count: Long = 0
        private set

    override fun read(): Int {
        val b = super.read()
        if (b != -1) count++
        return b
    }

    override fun read(b: ByteArray, off: Int, len: Int): Int {
        val n = super.read(b, off, len)
        if (n > 0) count += n
        return n
    }
}

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
fun Response.toWritableMap(metadata: RequestMetadata?): WritableMap {
    val map = Arguments.createMap()
    val metrics = Arguments.createMap()
    map.putMap("headers", headers.toWritableMap())
    map.putInt("code", code)
    map.putBoolean("ok", isSuccessful)

    body?.let { responseBody ->
        // Stream-decode the body so peak memory is the resulting String (plus a small
        // rolling char buffer), not the full body buffered in Okio segments first.
        // CountingInputStream tracks the byte count for the size metric, which stays
        // accurate when Content-Length is missing (chunked) or stale (compression).
        val countingStream = CountingInputStream(responseBody.source().inputStream())
        val bodyString = InputStreamReader(countingStream, StandardCharsets.UTF_8).use { reader ->
            val sb = StringBuilder()
            val charBuffer = CharArray(64 * 1024)
            var read = reader.read(charBuffer)
            while (read != -1) {
                sb.append(charBuffer, 0, read)
                read = reader.read(charBuffer)
            }
            sb.toString()
        }

        if (metadata != null) {
            val compressedSize = header("X-Compressed-Size")?.toDoubleOrNull() ?: header("Content-Length")?.toDoubleOrNull() ?: 0.0
            val startTime = header("X-Start-Time")?.toDoubleOrNull() ?: 0.0
            val endTime = header("X-End-Time")?.toDoubleOrNull() ?: 0.0
            val mbps = header("X-Speed-Mbps")?.toDoubleOrNull() ?: 0.0
            metrics.putDouble("compressedSize", compressedSize)
            metrics.putDouble("size", countingStream.count.toDouble())
            metrics.putDouble("startTime", startTime)
            metrics.putDouble("endTime", endTime)
            metrics.putDouble("speedInMbps", mbps)
        }

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

    if (metadata != null) {
        metrics.putDouble("latency", metadata.getLatency().toDouble())
        metrics.putDouble("connectionTime", metadata.getConnectionTime().toDouble())
        metrics.putString("httpVersion", metadata.httpVersion)
        metrics.putString("tlsVersion", metadata.sslVersion ?: "None")
        metrics.putString("tlsCipherSuite", metadata.sslCipher ?: "None")
        metrics.putBoolean("isCached", metadata.isCached)
        metrics.putString("networkType", metadata.networkType)
        map.putMap("metrics", metrics)
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
fun Request.Builder.applyHeaders(headers: Map<String, Any?>?): Request.Builder {
    if (headers != null){
        for ((k, v) in headers) {
            try {
                this.removeHeader(k)
                this.addHeader(k, v.toString())
            } catch (e: IllegalArgumentException) {
                // OkHttp validates header values and rejects non-ASCII characters
                // (e.g. control chars like 0x02 in corrupted auth tokens, or
                // Arabic-Indic digits from locale-dependent formatting).
                // Skip the invalid header and let the request proceed — the server
                // will reject it with a 4xx that the JS layer can handle gracefully.
                Log.w("NetworkClient", "Skipping header '$k': ${e.message}")
            }
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
            .fold("") { str, it -> str + "%02x".format(it) }
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
                    map.putNull(key)
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

@Suppress("UNCHECKED_CAST")
fun Array<Any?>.toWritableArray(): WritableArray? {
    val writableArray = Arguments.createArray()
    for (value in this) {
        if (value == null) {
            writableArray.pushNull()
        } else if (value is Boolean) {
            writableArray.pushBoolean((value as Boolean?)!!)
        } else if (value is Double) {
            writableArray.pushDouble((value as Double?)!!)
        } else if (value is Int) {
            writableArray.pushInt((value as Int?)!!)
        } else if (value is String) {
            writableArray.pushString(value as String?)
        } else if (value is Map<*, *>) {
            writableArray.pushMap((value as Map<String?, Any?>?)?.toWritableMap())
        } else if (value is ReadableMap) {
            writableArray.pushMap(value as ReadableMap?)
        } else if (value.javaClass.isArray) {
            writableArray.pushArray((value as Array<Any?>?)?.toWritableArray())
        }
    }
    return writableArray
}

@Suppress("UNCHECKED_CAST")
fun Map<String?, Any?>.toWritableMap(): WritableMap? {
    val writableMap = Arguments.createMap()
    for ((key, value) in this) {
        if (value == null) {
            writableMap.putNull(key!!)
        } else if (value is Boolean) {
            writableMap.putBoolean(key!!, (value as Boolean?)!!)
        } else if (value is Double) {
            writableMap.putDouble(key!!, (value as Double?)!!)
        } else if (value is Int) {
            writableMap.putInt(key!!, (value as Int?)!!)
        } else if (value is String) {
            writableMap.putString(key!!, value as String?)
        } else if (value is Map<*, *>) writableMap.putMap(key!!, (value as Map<String?, Any?>?)?.toWritableMap()) else if (value.javaClass.isArray) {
            writableMap.putArray(key!!, (value as Array<Any?>?)?.toWritableArray())
        }
    }
    return writableMap
}

@Suppress("UNCHECKED_CAST")
fun ReadableMap.toWritableMap(): WritableMap {
    val writableMap = Arguments.createMap()
    val iterator = toHashMap().iterator()
    while (iterator.hasNext()) {
        val (key, value) = iterator.next()
        if (value == null) {
            writableMap.putNull(key)
        } else if (value is Boolean) {
            writableMap.putBoolean(key, (value))
        } else if (value is Double) {
            writableMap.putDouble(key, (value))
        } else if (value is Int) {
            writableMap.putInt(key, (value))
        } else if (value is String) {
            writableMap.putString(key, value)
        } else if (value is Map<*, *>) writableMap.putMap(key, (value as Map<String?, Any?>).toWritableMap()) else if (value.javaClass.isArray) {
            writableMap.putArray(key, (value as Array<Any?>).toWritableArray())
        }
        iterator.remove()
    }

    return writableMap
}
