package com.mattermost.networkclient.helpers

import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.buffer

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
