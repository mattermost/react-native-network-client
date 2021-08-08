package com.mattermost.networkclient.helpers

import android.net.Uri
import com.mattermost.networkclient.APIClientModule
import com.mattermost.networkclient.enums.APIClientEvents
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import okhttp3.internal.closeQuietly
import okio.*
import java.io.IOException

class UploadFileRequestBody(private val uri: Uri, private val skipBytes: Long, private val taskId: String) : RequestBody() {
    private val stream = APIClientModule.context.contentResolver.openInputStream(uri)!!
    private val total = stream.available().toDouble();
    private val progressListener = ProgressListener(taskId, APIClientEvents.UPLOAD_PROGRESS.event)

    override fun contentLength(): Long {
        return total.toLong();
    }

    override fun contentType(): MediaType? {
        return APIClientModule.context.contentResolver.getType(uri)!!.toMediaTypeOrNull();
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
                progressListener.update(totalRead.toDouble(), total)
            }
        } catch (e: IOException) {
            // Allow upstream to handle
            throw e
        } finally {
            source.closeQuietly()
        }
    }
}
