package com.mattermost.networkclient.helpers

import com.mattermost.networkclient.enums.APIClientEvents
import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.*


class ProgressResponseBody(private val responseBody: ResponseBody, private val taskId: String, private val uncompressBytes: Long?): ResponseBody() {
    private var bufferedSource: BufferedSource? = null
    private val progressListener = ProgressListener(taskId, APIClientEvents.DOWNLOAD_PROGRESS.event)

    override fun contentLength(): Long {
        if (uncompressBytes != null) {
            return uncompressBytes
        }

        return responseBody.contentLength()
    }

    override fun contentType(): MediaType? {
        return responseBody.contentType()
    }

    override fun source(): BufferedSource {
        if (bufferedSource == null)
            bufferedSource = getForwardSource(responseBody.source()).buffer()
        return bufferedSource!!
    }

    override fun close() {
        super.close()
    }

    private fun getForwardSource(source: Source): Source =
            object : ForwardingSource(source) {
                var totalBytesRead = 0L

                @Throws(IOException::class)
                override fun read(sink: Buffer, byteCount: Long): Long {
                    val bytesRead = super.read(sink, byteCount)
                    // read() returns the number of bytes read, or -1 if this source is exhausted.
                    totalBytesRead += if (bytesRead != -1L) bytesRead else 0
                    progressListener.update(totalBytesRead.toDouble(), contentLength().toDouble(), bytesRead == -1L)
                    return bytesRead
                }
            }
}
