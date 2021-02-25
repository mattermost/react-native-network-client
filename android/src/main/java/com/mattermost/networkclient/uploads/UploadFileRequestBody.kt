package com.mattermost.networkclient.uploads

import android.content.ContentResolver
import android.net.Uri
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import okio.*
import java.io.IOException


class UploadFileRequestBody(private val resolver: ContentResolver, private val uri: Uri, private val listener: ProgressListener, private val skipBytes: Long?) : RequestBody() {

    private val stream = resolver.openInputStream(uri)!!
    private val total: Long = stream.available().toLong();

    override fun contentLength(): Long {
        return total;
    }

    override fun contentType(): MediaType? {
        return resolver.getType(uri)!!.toMediaTypeOrNull();
    }

    @Throws(IOException::class)
    override fun writeTo(sink: BufferedSink) {

        var source: Source = stream.source()
        var totalRead: Long = 0
        var read: Long

        if (skipBytes != null) {
            sink.buffer.skip(skipBytes)
            totalRead = skipBytes;
        }

        try {
            while (source.read(sink.buffer, 2048.toLong()).also { read = it } != -1L) {
                totalRead += read
                sink.flush()
                listener.update(totalRead, total)
            }
        } catch(e: IOException){
            // Hmmm
        } finally {
            source.close()
            listener.update(totalRead, total)
        }
    }
}
