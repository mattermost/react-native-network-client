package com.mattermost.networkclient.helpers

import android.net.Uri
import com.facebook.react.bridge.ReactContext

import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import okhttp3.internal.closeQuietly
import okio.*
import java.io.IOException


class UploadFileRequestBody(private val reactContext: ReactContext, private val uri: Uri, private val skipBytes: Long, private val listener: ProgressListener) : RequestBody() {

    private val stream = reactContext.contentResolver.openInputStream(uri)!!
    private val total: Double = stream.available().toDouble();

    override fun contentLength(): Long {
        return total.toLong();
    }

    override fun contentType(): MediaType? {
        return reactContext.contentResolver.getType(uri)!!.toMediaTypeOrNull();
    }

    @Throws(IOException::class)
    override fun writeTo(sink: BufferedSink) {
        val source: Source = stream.source()
        var totalRead: Long = 0
        var read: Long

        try {
            if (skipBytes > 0) {
                sink.buffer.skip(skipBytes)
                totalRead = skipBytes;
            }

            while (source.read(sink.buffer, 65536L).also { read = it } != -1L) {
                sink.flush()
                totalRead += read
                listener.update(totalRead.toDouble(), total)
            }
        } catch (e: IOException) {
            source.closeQuietly()
        } finally {
            source.closeQuietly()
        }
    }
}
