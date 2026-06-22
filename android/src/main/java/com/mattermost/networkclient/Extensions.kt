package com.mattermost.networkclient

import android.util.JsonReader
import android.util.JsonToken
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
import java.io.FilterInputStream
import java.io.InputStream
import java.io.InputStreamReader
import java.io.PushbackInputStream
import java.nio.charset.StandardCharsets
import java.security.MessageDigest


var Response.retriesExhausted: Boolean? by NetworkClient.RequestRetriesExhausted

// Number of bytes to peek for JSON sniffing. Large enough to skip any leading
// whitespace or a UTF-8 BOM before the first meaningful character.
private const val SNIFF_BYTES = 1024

// Maximum number of UTF-16 chars retained for non-JSON string bodies.
// Each char occupies 2 bytes in heap, so this caps heap usage at ~1 MB.
// Bodies beyond this limit are drained and discarded — they are not valid
// API payloads the app can use through the JS bridge.
private const val MAX_STRING_BODY_CHARS = 512 * 1024

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
 * Returns true when the MIME type string declares a JSON content type,
 * meaning we can skip body sniffing entirely.
 */
internal fun isMimeTypeJson(mimeType: String): Boolean =
    mimeType == "application/json" ||
        (mimeType.startsWith("application/") && mimeType.endsWith("+json")) ||
        mimeType == "text/json"

/**
 * Returns true when the raw JSON number token should be routed to a
 * floating-point parse rather than a long parse. Covers decimal points
 * and both exponent indicator characters.
 */
internal fun isJsonNumberFloat(raw: String): Boolean =
    raw.contains('.') || raw.contains('e') || raw.contains('E')

/**
 * Strips a UTF-8 BOM (EF BB BF) from the head of [stream] if present,
 * then returns the stream ready for downstream parsing. When no BOM is
 * found every byte is pushed back so the stream is unmodified.
 *
 * Uses a 3-byte PushbackInputStream internally; the caller receives the
 * pushback stream directly so no extra wrapping is needed.
 */
internal fun stripBom(stream: InputStream): PushbackInputStream {
    val pushback = PushbackInputStream(stream, 3)
    val bom = ByteArray(3)
    var bomRead = 0
    while (bomRead < 3) {
        val n = pushback.read(bom, bomRead, 3 - bomRead)
        if (n == -1) break
        bomRead += n
    }
    if (bomRead > 0) {
        val hasBom = bomRead == 3 &&
            bom[0] == 0xEF.toByte() &&
            bom[1] == 0xBB.toByte() &&
            bom[2] == 0xBF.toByte()
        if (!hasBom) pushback.unread(bom, 0, bomRead)
    }
    return pushback
}

/**
 * Sniffs up to [SNIFF_BYTES] from [stream] to find the first non-whitespace,
 * non-BOM byte without buffering the full body. Returns true when that byte
 * is '{' or '[', indicating a JSON object or array.
 *
 * The BOM (if present) is consumed and discarded. All other sniff bytes are
 * pushed back so the returned stream begins at the first meaningful byte
 * (preceded by any non-BOM whitespace that was part of the sniff window).
 */
internal fun sniffIsJson(stream: InputStream): Pair<Boolean, PushbackInputStream> {
    val pushback = PushbackInputStream(stripBom(stream), SNIFF_BYTES)
    val sniffBuf = ByteArray(SNIFF_BYTES)
    var sniffRead = 0
    while (sniffRead < SNIFF_BYTES) {
        val n = pushback.read(sniffBuf, sniffRead, SNIFF_BYTES - sniffRead)
        if (n == -1) break
        sniffRead += n
    }

    var firstMeaningful: Byte = 0
    for (i in 0 until sniffRead) {
        val b = sniffBuf[i]
        if (b != ' '.code.toByte() &&
            b != '\t'.code.toByte() &&
            b != '\n'.code.toByte() &&
            b != '\r'.code.toByte()) {
            firstMeaningful = b
            break
        }
    }

    if (sniffRead > 0) {
        pushback.unread(sniffBuf, 0, sniffRead)
    }

    val isJson = firstMeaningful == '{'.code.toByte() || firstMeaningful == '['.code.toByte()
    return Pair(isJson, pushback)
}

/**
 * Reads at most MAX_STRING_BODY_CHARS from the stream into a String and then
 * discards the remainder. Prevents unbounded heap allocation for non-JSON bodies.
 */
internal fun readCappedString(stream: InputStream): String {
    val sb = StringBuilder()
    val charBuffer = CharArray(64 * 1024)
    var totalChars = 0
    InputStreamReader(stream, StandardCharsets.UTF_8).use { reader ->
        var read = reader.read(charBuffer)
        while (read != -1) {
            val toAppend = minOf(read, MAX_STRING_BODY_CHARS - totalChars)
            if (toAppend > 0) sb.append(charBuffer, 0, toAppend)
            totalChars += read
            if (totalChars >= MAX_STRING_BODY_CHARS) {
                // Drain remaining bytes via the raw stream to release Okio segments
                // without accumulating any more data in heap.
                val drainBuffer = ByteArray(64 * 1024)
                while (stream.read(drainBuffer) != -1) { /* drain */ }
                break
            }
            read = reader.read(charBuffer)
        }
    }
    return sb.toString()
}

/**
 * Recursively reads a JSON object from the JsonReader into a WritableMap.
 */
private fun JsonReader.readWritableMap(): WritableMap {
    val map = Arguments.createMap()
    beginObject()
    while (hasNext()) {
        val key = nextName()
        when (peek()) {
            JsonToken.BEGIN_OBJECT -> map.putMap(key, readWritableMap())
            JsonToken.BEGIN_ARRAY -> map.putArray(key, readWritableArray())
            JsonToken.STRING -> map.putString(key, nextString())
            JsonToken.BOOLEAN -> map.putBoolean(key, nextBoolean())
            JsonToken.NUMBER -> {
                val raw = nextString()
                if (isJsonNumberFloat(raw)) {
                    val d = raw.toDoubleOrNull()
                    if (d != null && d.isFinite()) map.putDouble(key, d) else map.putString(key, raw)
                } else {
                    val l = raw.toLongOrNull()
                    when {
                        l == null -> {
                            val d = raw.toDoubleOrNull()
                            if (d != null && d.isFinite()) map.putDouble(key, d) else map.putString(key, raw)
                        }
                        l in Int.MIN_VALUE..Int.MAX_VALUE -> map.putInt(key, l.toInt())
                        else -> map.putDouble(key, l.toDouble())
                    }
                }
            }
            JsonToken.NULL -> { nextNull(); map.putNull(key) }
            else -> skipValue()
        }
    }
    endObject()
    return map
}

/**
 * Recursively reads a JSON array from the JsonReader into a WritableArray.
 */
private fun JsonReader.readWritableArray(): WritableArray {
    val array = Arguments.createArray()
    beginArray()
    while (hasNext()) {
        when (peek()) {
            JsonToken.BEGIN_OBJECT -> array.pushMap(readWritableMap())
            JsonToken.BEGIN_ARRAY -> array.pushArray(readWritableArray())
            JsonToken.STRING -> array.pushString(nextString())
            JsonToken.BOOLEAN -> array.pushBoolean(nextBoolean())
            JsonToken.NUMBER -> {
                val raw = nextString()
                if (isJsonNumberFloat(raw)) {
                    val d = raw.toDoubleOrNull()
                    if (d != null && d.isFinite()) array.pushDouble(d) else array.pushString(raw)
                } else {
                    val l = raw.toLongOrNull()
                    when {
                        l == null -> {
                            val d = raw.toDoubleOrNull()
                            if (d != null && d.isFinite()) array.pushDouble(d) else array.pushString(raw)
                        }
                        l in Int.MIN_VALUE..Int.MAX_VALUE -> array.pushInt(l.toInt())
                        else -> array.pushDouble(l.toDouble())
                    }
                }
            }
            JsonToken.NULL -> { nextNull(); array.pushNull() }
            else -> skipValue()
        }
    }
    endArray()
    return array
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
        val countingStream = CountingInputStream(responseBody.source().inputStream())

        val mimeType = responseBody.contentType()?.let { "${it.type}/${it.subtype}" } ?: ""
        val isJson: Boolean
        val pushback: PushbackInputStream

        if (isMimeTypeJson(mimeType)) {
            isJson = true
            pushback = stripBom(countingStream)
        } else {
            val (sniffed, sniffStream) = sniffIsJson(countingStream)
            isJson = sniffed
            pushback = sniffStream
        }

        if (isJson) {
            // Stream-parse JSON token by token directly from the InputStream.
            // No intermediate String or StringBuilder — the Okio segment buffer
            // drains at token-read speed and peak heap is the WritableMap tree only.
            JsonReader(InputStreamReader(pushback, StandardCharsets.UTF_8)).use { reader ->
                try {
                    when (reader.peek()) {
                        JsonToken.BEGIN_OBJECT -> map.putMap("data", reader.readWritableMap())
                        JsonToken.BEGIN_ARRAY -> map.putArray("data", reader.readWritableArray())
                        JsonToken.STRING -> map.putString("data", reader.nextString())
                        JsonToken.BOOLEAN -> map.putBoolean("data", reader.nextBoolean())
                        JsonToken.NUMBER -> {
                            val raw = reader.nextString()
                            if (isJsonNumberFloat(raw)) {
                                val d = raw.toDoubleOrNull()
                                if (d != null && d.isFinite()) map.putDouble("data", d) else map.putString("data", raw)
                            } else {
                                val l = raw.toLongOrNull()
                                when {
                                    l == null -> {
                                        val d = raw.toDoubleOrNull()
                                        if (d != null && d.isFinite()) map.putDouble("data", d) else map.putString("data", raw)
                                    }
                                    l in Int.MIN_VALUE..Int.MAX_VALUE -> map.putInt("data", l.toInt())
                                    else -> map.putDouble("data", l.toDouble())
                                }
                            }
                        }
                        JsonToken.NULL -> { reader.nextNull(); map.putNull("data") }
                        else -> map.putString("data", "")
                    }
                } catch (_: Exception) {
                    map.putNull("data")
                } finally {
                    // Drain any remaining bytes before the reader closes the stream so
                    // OkHttp can reuse the connection and countingStream.count is accurate.
                    try {
                        val drainBuffer = ByteArray(64 * 1024)
                        while (pushback.read(drainBuffer) != -1) { /* drain */ }
                    } catch (_: Exception) { }
                }
            }
        } else {
            // Non-JSON body — read into a string with a hard cap to prevent OOM.
            // Responses beyond the cap are not valid API payloads the app can use.
            map.putString("data", readCappedString(pushback))
        }

        if (metadata != null) {
            val compressedSize = if (metadata.compressedSize >= 0) metadata.compressedSize
                else header("Content-Length")?.toLongOrNull() ?: 0L
            metrics.putDouble("compressedSize", compressedSize.toDouble())
            metrics.putDouble("size", countingStream.count.toDouble())
            metrics.putDouble("startTime", metadata.requestStartNanos.toDouble())
            metrics.putDouble("endTime", metadata.requestEndNanos.toDouble())
            metrics.putDouble("speedInMbps", metadata.getSpeedInMbps())
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
