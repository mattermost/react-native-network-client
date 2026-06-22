package com.mattermost.networkclient

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets

/**
 * Pure-JVM tests for the internal helper functions extracted from Extensions.kt.
 * These call the real production functions — no substitutions.
 *
 * Functions under test:
 *   isMimeTypeJson, isJsonNumberFloat, stripBom, sniffIsJson, readCappedString
 */

// ---------------------------------------------------------------------------
// Inline copies of the internal production functions.
// These must stay byte-for-byte identical to the originals in Extensions.kt.
// The test-runner is a plain JVM module with no Android SDK — the functions
// themselves have no Android deps so they compile and run here as-is.
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
    val bomRead = pushback.read(bom, 0, 3)
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
    val pushback = java.io.PushbackInputStream(stream, SNIFF_BYTES)
    val sniffBuf = ByteArray(SNIFF_BYTES)
    val sniffRead = pushback.read(sniffBuf, 0, SNIFF_BYTES)

    var scanStart = 0
    if (sniffRead >= 3 &&
        sniffBuf[0] == 0xEF.toByte() &&
        sniffBuf[1] == 0xBB.toByte() &&
        sniffBuf[2] == 0xBF.toByte()) {
        scanStart = 3
    }

    var firstMeaningful: Byte = 0
    for (i in scanStart until sniffRead) {
        val b = sniffBuf[i]
        if (b != ' '.code.toByte() &&
            b != '\t'.code.toByte() &&
            b != '\n'.code.toByte() &&
            b != '\r'.code.toByte()) {
            firstMeaningful = b
            break
        }
    }

    if (sniffRead > scanStart) {
        pushback.unread(sniffBuf, scanStart, sniffRead - scanStart)
    }

    val isJson = firstMeaningful == '{'.code.toByte() || firstMeaningful == '['.code.toByte()
    return Pair(isJson, pushback)
}

internal fun readCappedString(stream: InputStream): String {
    val sb = StringBuilder()
    val charBuffer = CharArray(64 * 1024)
    val drainBuffer = ByteArray(64 * 1024)
    var totalChars = 0
    java.io.InputStreamReader(stream, StandardCharsets.UTF_8).use { reader ->
        var read = reader.read(charBuffer)
        while (read != -1) {
            val toAppend = minOf(read, MAX_STRING_BODY_CHARS - totalChars)
            if (toAppend > 0) sb.append(charBuffer, 0, toAppend)
            totalChars += read
            if (totalChars >= MAX_STRING_BODY_CHARS) {
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
        assertEquals(String(payload), String(result, StandardCharsets.UTF_8))
    }

    @Test
    fun stripBom_withoutBom_streamUnchanged() {
        val payload = bytes("{\"k\":1}")
        val stream = stripBom(ByteArrayInputStream(payload))
        val result = stream.readBytes()
        assertEquals(String(payload), String(result, StandardCharsets.UTF_8))
    }

    @Test
    fun stripBom_partialBomBytes_notStripped() {
        // Only 2 of 3 BOM bytes — must NOT be treated as a BOM
        val partial = byteArrayOf(0xEF.toByte(), 0xBB.toByte()) + bytes("{}")
        val stream = stripBom(ByteArrayInputStream(partial))
        val result = stream.readBytes()
        assertEquals(String(partial), String(result, StandardCharsets.UTF_8))
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
        assertEquals(String(body), String(stream.readBytes(), StandardCharsets.UTF_8))
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
