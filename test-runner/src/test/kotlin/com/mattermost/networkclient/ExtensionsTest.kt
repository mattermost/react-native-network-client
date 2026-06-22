package com.mattermost.networkclient

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets

/**
 * Pure-JVM tests for the internal helper functions from Extensions.kt.
 *
 * The test-runner has no Android SDK, so the helpers are duplicated below
 * rather than imported. These copies MUST be kept in sync with Extensions.kt
 * whenever the originals change.
 *
 * Functions under test:
 *   isMimeTypeJson, isJsonNumberFloat, stripBom, sniffIsJson, readCappedString
 */

// ---------------------------------------------------------------------------
// Inline copies of the internal production functions (no Android deps).
// ---------------------------------------------------------------------------

private val SNIFF_BYTES = 1024
private val MAX_STRING_BODY_CHARS = 512 * 1024

internal fun isMimeTypeJson(mimeType: String): Boolean =
    mimeType == "application/json" ||
        (mimeType.startsWith("application/") && mimeType.endsWith("+json")) ||
        mimeType == "text/json"

internal fun isJsonNumberFloat(raw: String): Boolean =
    raw.contains('.') || raw.contains('e') || raw.contains('E')

internal fun stripBom(stream: InputStream): java.io.PushbackInputStream {
    val pushback = java.io.PushbackInputStream(stream, 3)
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

internal fun sniffIsJson(stream: InputStream): Pair<Boolean, java.io.PushbackInputStream> {
    val pushback = java.io.PushbackInputStream(stripBom(stream), SNIFF_BYTES)
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

internal fun readCappedString(stream: InputStream): String {
    val sb = StringBuilder()
    val charBuffer = CharArray(64 * 1024)
    var totalChars = 0
    java.io.InputStreamReader(stream, StandardCharsets.UTF_8).use { reader ->
        var read = reader.read(charBuffer)
        while (read != -1) {
            val toAppend = minOf(read, MAX_STRING_BODY_CHARS - totalChars)
            if (toAppend > 0) sb.append(charBuffer, 0, toAppend)
            totalChars += read
            if (totalChars >= MAX_STRING_BODY_CHARS) {
                val drainBuffer = ByteArray(64 * 1024)
                while (stream.read(drainBuffer) != -1) { /* drain */ }
                break
            }
            read = reader.read(charBuffer)
        }
    }
    return sb.toString()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

class ExtensionsTest {

    private fun bytes(s: String) = s.toByteArray(StandardCharsets.UTF_8)
    private val UTF8_BOM = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte())

    // --- isMimeTypeJson ------------------------------------------------------

    @Test fun mimeType_applicationJson_isJson() = assertTrue(isMimeTypeJson("application/json"))
    @Test fun mimeType_textJson_isJson() = assertTrue(isMimeTypeJson("text/json"))
    @Test fun mimeType_problemJson_isJson() = assertTrue(isMimeTypeJson("application/problem+json"))
    @Test fun mimeType_vndApiJson_isJson() = assertTrue(isMimeTypeJson("application/vnd.api+json"))
    @Test fun mimeType_textPlain_notJson() = assertFalse(isMimeTypeJson("text/plain"))
    @Test fun mimeType_textHtml_notJson() = assertFalse(isMimeTypeJson("text/html"))
    @Test fun mimeType_octetStream_notJson() = assertFalse(isMimeTypeJson("application/octet-stream"))
    @Test fun mimeType_applicationXml_notJson() = assertFalse(isMimeTypeJson("application/xml"))
    @Test fun mimeType_empty_notJson() = assertFalse(isMimeTypeJson(""))

    // --- isJsonNumberFloat ---------------------------------------------------

    @Test fun number_integer_notFloat() = assertFalse(isJsonNumberFloat("42"))
    @Test fun number_negative_notFloat() = assertFalse(isJsonNumberFloat("-7"))
    @Test fun number_zero_notFloat() = assertFalse(isJsonNumberFloat("0"))
    @Test fun number_decimal_isFloat() = assertTrue(isJsonNumberFloat("3.14"))
    @Test fun number_exponentLower_isFloat() = assertTrue(isJsonNumberFloat("1e3"))
    @Test fun number_exponentUpper_isFloat() = assertTrue(isJsonNumberFloat("1E3"))
    @Test fun number_negativeExponent_isFloat() = assertTrue(isJsonNumberFloat("1E-3"))
    @Test fun number_decimalWithExponent_isFloat() = assertTrue(isJsonNumberFloat("1.5e10"))
    @Test fun number_negativeDecimal_isFloat() = assertTrue(isJsonNumberFloat("-2.0"))
    @Test fun number_largeInteger_notFloat() = assertFalse(isJsonNumberFloat("9007199254740992"))

    @Test
    fun number_intFitsInInt_routesToInt() {
        val raw = "42"
        assertFalse(isJsonNumberFloat(raw))
        val l = raw.toLong()
        assertTrue(l in Int.MIN_VALUE..Int.MAX_VALUE)
    }

    @Test
    fun number_longOverflowsInt_routesToDouble() {
        val raw = "9999999999"
        assertFalse(isJsonNumberFloat(raw))
        val l = raw.toLong()
        assertFalse(l in Int.MIN_VALUE..Int.MAX_VALUE)
    }

    @Test
    fun number_exponentValues_parseCorrectly() {
        assertEquals(1000.0, "1e3".toDouble(), 0.0)
        assertEquals(0.001, "1E-3".toDouble(), 1e-10)
        assertEquals(-2e10, "-2e10".toDouble(), 0.0)
    }

    // --- stripBom ------------------------------------------------------------

    @Test
    fun stripBom_withBom_bomIsConsumed() {
        val payload = bytes("{\"k\":1}")
        val stream = stripBom(ByteArrayInputStream(UTF8_BOM + payload))
        val result = stream.readBytes()
        assertEquals(String(payload, StandardCharsets.UTF_8), String(result, StandardCharsets.UTF_8))
    }

    @Test
    fun stripBom_withoutBom_streamUnchanged() {
        val payload = bytes("{\"k\":1}")
        val stream = stripBom(ByteArrayInputStream(payload))
        val result = stream.readBytes()
        assertEquals(String(payload, StandardCharsets.UTF_8), String(result, StandardCharsets.UTF_8))
    }

    @Test
    fun stripBom_partialBomBytes_notStripped() {
        // Only 2 of 3 BOM bytes — must NOT be treated as a BOM
        val partial = byteArrayOf(0xEF.toByte(), 0xBB.toByte()) + bytes("{}")
        val stream = stripBom(ByteArrayInputStream(partial))
        val result = stream.readBytes()
        assertEquals(String(partial, StandardCharsets.UTF_8), String(result, StandardCharsets.UTF_8))
    }

    @Test
    fun stripBom_emptyBody_noError() {
        val stream = stripBom(ByteArrayInputStream(ByteArray(0)))
        assertEquals(0, stream.readBytes().size)
    }

    @Test
    fun stripBom_bomOnly_returnsEmpty() {
        val stream = stripBom(ByteArrayInputStream(UTF8_BOM))
        assertEquals(0, stream.readBytes().size)
    }

    // --- sniffIsJson ---------------------------------------------------------

    @Test fun sniff_objectStart_isJson() = assertTrue(sniffIsJson(ByteArrayInputStream(bytes("{}"))).first)
    @Test fun sniff_arrayStart_isJson() = assertTrue(sniffIsJson(ByteArrayInputStream(bytes("[]"))).first)
    @Test fun sniff_plainText_notJson() = assertFalse(sniffIsJson(ByteArrayInputStream(bytes("hello"))).first)
    @Test fun sniff_xmlStart_notJson() = assertFalse(sniffIsJson(ByteArrayInputStream(bytes("<xml/>"))).first)
    @Test fun sniff_emptyBody_notJson() = assertFalse(sniffIsJson(ByteArrayInputStream(ByteArray(0))).first)
    @Test fun sniff_allWhitespace_notJson() = assertFalse(sniffIsJson(ByteArrayInputStream(bytes("   \t\n\r"))).first)

    @Test
    fun sniff_leadingWhitespace_detectedAsJson() {
        val (isJson, stream) = sniffIsJson(ByteArrayInputStream(bytes("   \t\n\r{\"k\":1}")))
        assertTrue("Whitespace before '{' must still detect as JSON", isJson)
        assertTrue(String(stream.readBytes(), StandardCharsets.UTF_8).trimStart().startsWith("{"))
    }

    @Test
    fun sniff_bom_isStrippedAndJsonDetected() {
        val (isJson, stream) = sniffIsJson(ByteArrayInputStream(UTF8_BOM + bytes("{\"k\":1}")))
        assertTrue("BOM + '{' must detect as JSON", isJson)
        val remaining = String(stream.readBytes(), StandardCharsets.UTF_8)
        assertFalse("BOM must not appear in remaining stream", remaining.startsWith("﻿"))
        assertTrue(remaining.startsWith("{"))
    }

    @Test
    fun sniff_bomWithArray_isStrippedAndDetected() {
        val (isJson, _) = sniffIsJson(ByteArrayInputStream(UTF8_BOM + bytes("[1,2,3]")))
        assertTrue(isJson)
    }

    @Test
    fun sniff_bodyLargerThanWindow_firstByteDetected() {
        val large = bytes("{" + "x".repeat(SNIFF_BYTES * 2) + "}")
        val (isJson, stream) = sniffIsJson(ByteArrayInputStream(large))
        assertTrue(isJson)
        assertEquals('{'.code.toByte(), stream.readBytes()[0])
    }

    @Test
    fun sniff_pushbackPreservesFullStream() {
        val body = bytes("{\"key\":\"value\"}")
        val (_, stream) = sniffIsJson(ByteArrayInputStream(body))
        assertEquals(String(body, StandardCharsets.UTF_8), String(stream.readBytes(), StandardCharsets.UTF_8))
    }

    @Test
    fun sniff_shortReadStream_stillDetectsJson() {
        // Simulates an InputStream that delivers bytes in 1-byte chunks — the
        // classic short-read scenario. Without the fill loop, a single read()
        // call returns only 1 byte and the '{' at position 0 is never seen.
        val body = bytes("{\"key\":\"value\"}")
        val slowStream = object : InputStream() {
            private var pos = 0
            override fun read(): Int = if (pos < body.size) body[pos++].toInt() and 0xFF else -1
            override fun read(b: ByteArray, off: Int, len: Int): Int {
                // Deliver at most 1 byte per call
                if (pos >= body.size) return -1
                b[off] = body[pos++]
                return 1
            }
        }
        val (isJson, stream) = sniffIsJson(slowStream)
        assertTrue("Short-read stream with '{' must still detect as JSON", isJson)
        val remaining = String(stream.readBytes(), StandardCharsets.UTF_8)
        assertEquals(String(body, StandardCharsets.UTF_8), remaining)
    }

    @Test
    fun stripBom_shortReadStream_stillStrippedCorrectly() {
        // Simulates a stream that delivers the BOM 1 byte at a time.
        val payload = bytes("{}")
        val input = UTF8_BOM + payload
        val slowStream = object : InputStream() {
            private var pos = 0
            override fun read(): Int = if (pos < input.size) input[pos++].toInt() and 0xFF else -1
            override fun read(b: ByteArray, off: Int, len: Int): Int {
                if (pos >= input.size) return -1
                b[off] = input[pos++]
                return 1
            }
        }
        val stream = stripBom(slowStream)
        val result = stream.readBytes()
        assertEquals(String(payload, StandardCharsets.UTF_8), String(result, StandardCharsets.UTF_8))
    }

    // --- readCappedString ----------------------------------------------------

    @Test
    fun cappedString_shortBody_returnsFull() {
        val input = "hello world"
        assertEquals(input, readCappedString(ByteArrayInputStream(bytes(input))))
    }

    @Test
    fun cappedString_emptyBody_returnsEmpty() {
        assertEquals("", readCappedString(ByteArrayInputStream(ByteArray(0))))
    }

    @Test
    fun cappedString_exactlyAtCap_returnsAll() {
        val input = "a".repeat(MAX_STRING_BODY_CHARS)
        val result = readCappedString(ByteArrayInputStream(bytes(input)))
        assertEquals(MAX_STRING_BODY_CHARS, result.length)
        assertTrue(result.all { it == 'a' })
    }

    @Test
    fun cappedString_overCap_truncatesAtCap() {
        val input = "b".repeat(MAX_STRING_BODY_CHARS * 2)
        val result = readCappedString(ByteArrayInputStream(bytes(input)))
        assertEquals(MAX_STRING_BODY_CHARS, result.length)
        assertTrue(result.all { it == 'b' })
    }

    @Test
    fun cappedString_overCap_drainsDontAccumulate() {
        // Verify that excess bytes beyond the cap don't end up in the result —
        // the drain loop must consume them silently.
        val belowCap = "a".repeat(MAX_STRING_BODY_CHARS)
        val excess = "Z".repeat(MAX_STRING_BODY_CHARS)
        val result = readCappedString(ByteArrayInputStream(bytes(belowCap + excess)))
        assertEquals(MAX_STRING_BODY_CHARS, result.length)
        assertFalse("Drained excess must not appear in result", result.contains('Z'))
    }

    @Test
    fun cappedString_multibyteUtf8_truncatesOnCharBoundary() {
        // Each '€' is 3 UTF-8 bytes but 1 UTF-16 char.
        val overCap = "€".repeat(MAX_STRING_BODY_CHARS + 1)
        val result = readCappedString(ByteArrayInputStream(bytes(overCap)))
        assertEquals(MAX_STRING_BODY_CHARS, result.length)
    }

    @Test
    fun cappedString_closesStream() {
        var closed = false
        val stream = object : ByteArrayInputStream(bytes("data")) {
            override fun close() { closed = true; super.close() }
        }
        readCappedString(stream)
        assertTrue("Stream must be closed after readCappedString", closed)
    }
}
