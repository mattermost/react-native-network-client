package com.mattermost.networkclient

import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.concurrent.atomic.AtomicLong

// ---------------------------------------------------------------------------
// Inline copy of CountingResponseBody (no Android deps in test-runner)
// ---------------------------------------------------------------------------

class CountingResponseBody(
    private val delegate: ResponseBody,
    private val onComplete: (Long) -> Unit,
) : ResponseBody() {
    private var totalBytesRead = 0L
    private var completed = false

    override fun contentType(): MediaType? = delegate.contentType()
    override fun contentLength(): Long = delegate.contentLength()

    override fun source(): BufferedSource {
        val countingSource = object : ForwardingSource(delegate.source()) {
            override fun read(sink: Buffer, byteCount: Long): Long {
                val read = super.read(sink, byteCount)
                if (read != -1L) {
                    totalBytesRead += read
                } else {
                    notifyComplete()
                }
                return read
            }

            override fun close() {
                notifyComplete()
                super.close()
            }
        }
        return countingSource.buffer()
    }

    private fun notifyComplete() {
        if (!completed) {
            completed = true
            onComplete(totalBytesRead)
        }
    }
}

// ---------------------------------------------------------------------------
// Interceptor that mirrors CompressedResponseSizeInterceptor logic,
// writing results into a shared AtomicLong instead of RequestMetadata
// (no Android deps in test-runner).
// ---------------------------------------------------------------------------

class TestCompressedResponseSizeInterceptor(
    private val compressedSizeOut: AtomicLong,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())

        val contentLength = response.header("Content-Length")?.toLongOrNull()
            ?: response.header("content-length")?.toLongOrNull()

        if (contentLength != null) {
            compressedSizeOut.set(contentLength)
            return response
        }

        val body = response.body ?: return response

        val countingBody = CountingResponseBody(body) { bytesRead ->
            compressedSizeOut.set(bytesRead)
        }
        return response.newBuilder().body(countingBody).build()
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

class CompressedResponseSizeInterceptorTest {

    // --- CountingResponseBody unit tests ------------------------------------

    @Test
    fun countingBody_reportsCorrectSizeAtEof() {
        val payload = "Hello, World!".toByteArray()
        val delegate = payload.toResponseBody("text/plain".toMediaType())

        var reported = -1L
        val body = CountingResponseBody(delegate) { reported = it }

        body.source().use { src ->
            val sink = Buffer()
            while (src.read(sink, 8192) != -1L) { /* drain */ }
        }

        assertEquals(payload.size.toLong(), reported)
    }

    @Test
    fun countingBody_reportsOnCloseBeforeEof() {
        val payload = ByteArray(1024) { it.toByte() }
        val delegate = payload.toResponseBody("application/octet-stream".toMediaType())

        var reported = -1L
        val body = CountingResponseBody(delegate) { reported = it }

        body.source().use { src ->
            val sink = Buffer()
            // Read only half then close — close() must still fire onComplete
            src.read(sink, 512)
        }

        assertTrue("onComplete should have fired on early close", reported >= 0)
        assertTrue("reported count should be <= total", reported <= payload.size.toLong())
    }

    @Test
    fun countingBody_onCompleteFiresExactlyOnce() {
        val payload = "data".toByteArray()
        val delegate = payload.toResponseBody("text/plain".toMediaType())

        var callCount = 0
        val body = CountingResponseBody(delegate) { callCount++ }

        body.source().use { src ->
            val sink = Buffer()
            // Read to EOF (fires onComplete via read returning -1)…
            while (src.read(sink, 8192) != -1L) { /* drain */ }
            // …then close() runs — must NOT fire again
        }

        assertEquals("onComplete must fire exactly once", 1, callCount)
    }

    /**
     * Streams a 512 MB synthetic response through CountingResponseBody using a
     * on-the-fly source that never allocates more than one 64 KB chunk at a time.
     * Peak heap is ~64 KB regardless of total size — this test proves no OOM occurs
     * and that the byte count is exact.
     */
    @Test
    fun countingBody_512mb_noOom() {
        val chunkSize = 64 * 1024
        val totalBytes = 512L * 1024 * 1024 // 512 MB
        val chunk = ByteArray(chunkSize) { 0xAB.toByte() }

        val delegate = object : ResponseBody() {
            private val src: BufferedSource = object : ForwardingSource(Buffer()) {
                private var remaining = totalBytes
                override fun read(sink: Buffer, byteCount: Long): Long {
                    if (remaining <= 0L) return -1L
                    val toWrite = minOf(byteCount, remaining, chunkSize.toLong())
                    sink.write(chunk, 0, toWrite.toInt())
                    remaining -= toWrite
                    return toWrite
                }
            }.buffer()

            override fun contentType() = "application/octet-stream".toMediaType()
            override fun contentLength() = totalBytes
            override fun source() = src
        }

        var reported = -1L
        val body = CountingResponseBody(delegate) { reported = it }

        body.source().use { src ->
            val sink = Buffer()
            while (src.read(sink, chunkSize.toLong()) != -1L) {
                sink.clear() // discard immediately — never accumulate in heap
            }
        }

        assertEquals("512 MB stream must be counted exactly", totalBytes, reported)
    }

    // --- Interceptor integration tests (MockWebServer) ----------------------

    @Test
    fun interceptor_usesContentLengthWhenPresent() {
        MockWebServer().use { server ->
            server.enqueue(
                MockResponse()
                    .setBody("hello")
                    .setHeader("Content-Length", "5")
            )
            server.start()

            val sizeOut = AtomicLong(-1)
            val client = OkHttpClient.Builder()
                .addNetworkInterceptor(TestCompressedResponseSizeInterceptor(sizeOut))
                .build()

            client.newCall(Request.Builder().url(server.url("/")).build())
                .execute().use { it.body?.string() }

            assertEquals("Should use Content-Length directly", 5L, sizeOut.get())
        }
    }

    @Test
    fun interceptor_countsChunkedBodyCorrectly() {
        val body = "chunked response body"
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setChunkedBody(body, 4))
            server.start()

            val sizeOut = AtomicLong(-1)
            val client = OkHttpClient.Builder()
                .addNetworkInterceptor(TestCompressedResponseSizeInterceptor(sizeOut))
                .build()

            client.newCall(Request.Builder().url(server.url("/")).build())
                .execute().use { it.body?.string() }

            assertEquals(
                "Should count chunked body bytes correctly",
                body.toByteArray().size.toLong(),
                sizeOut.get()
            )
        }
    }

    /**
     * 8 MB chunked response via MockWebServer — the largest safe size since
     * MockWebServer buffers the full body before serving. Verifies that the
     * interceptor streams without OOM and reports the exact byte count.
     */
    @Test
    fun interceptor_8mb_chunkedBody_noOom() {
        val payloadSize = 8 * 1024 * 1024
        val payload = ByteArray(payloadSize) { (it % 256).toByte() }

        MockWebServer().use { server ->
            server.enqueue(MockResponse().setChunkedBody(okio.Buffer().write(payload), 32768))
            server.start()

            val sizeOut = AtomicLong(-1)
            val client = OkHttpClient.Builder()
                .addNetworkInterceptor(TestCompressedResponseSizeInterceptor(sizeOut))
                .build()

            client.newCall(Request.Builder().url(server.url("/")).build())
                .execute().use { response ->
                    response.body?.source()?.use { src ->
                        val sink = Buffer()
                        while (src.read(sink, 32768) != -1L) sink.clear()
                    }
                }

            assertEquals(payloadSize.toLong(), sizeOut.get())
        }
    }

    @Test
    fun interceptor_reportsZeroForEmptyBody() {
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setBody(""))
            server.start()

            val sizeOut = AtomicLong(-1)
            val client = OkHttpClient.Builder()
                .addNetworkInterceptor(TestCompressedResponseSizeInterceptor(sizeOut))
                .build()

            client.newCall(Request.Builder().url(server.url("/")).build())
                .execute().use { it.body?.string() }

            assertTrue("Size should be >= 0 for empty body", sizeOut.get() >= 0)
        }
    }

    @Test
    fun interceptor_reportsCorrectly_whenBodyClosedEarly() {
        val body = "abcdefghijklmnopqrstuvwxyz"
        MockWebServer().use { server ->
            server.enqueue(MockResponse().setChunkedBody(body, 4))
            server.start()

            val sizeOut = AtomicLong(-1)
            val client = OkHttpClient.Builder()
                .addNetworkInterceptor(TestCompressedResponseSizeInterceptor(sizeOut))
                .build()

            client.newCall(Request.Builder().url(server.url("/")).build())
                .execute().use { response ->
                    response.body?.source()?.use { src ->
                        val sink = Buffer()
                        src.read(sink, 10) // read only first 10 bytes then close
                    }
                }

            // onComplete must have fired via close() even without reading to EOF
            assertTrue("onComplete should fire on early close", sizeOut.get() >= 0)
            assertTrue("Partial read should be <= total body size", sizeOut.get() <= body.length.toLong())
        }
    }
}
