package com.mattermost.networkclient.uploads

import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import okhttp3.internal.closeQuietly
import okio.*
import java.io.File
import java.io.IOException
import java.net.URLConnection


class UploadFileRequestBody(private val file: File, private val listener: ProgressListener, private val skipBytes: Long?) : RequestBody() {

    override fun contentLength(): Long {
        return file.length()
    }

    override fun contentType(): MediaType? {
        return URLConnection.guessContentTypeFromName(file.name).toMediaTypeOrNull();
    }

    @Throws(IOException::class)
    override fun writeTo(sink: BufferedSink) {
        var source: Source? = null
        var total: Long = 0
        var read: Long

        if (skipBytes != null) sink.buffer.skip(skipBytes)

        try {
            source = file.source()
            while (source.read(sink.buffer, 2048.toLong()).also { read = it } != -1L) {
                total += read
                sink.flush()
                listener.update(total, file.length())
            }
        } finally {
            source!!.closeQuietly()
            listener.update(total, file.length())
        }
    }
}
