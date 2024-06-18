package com.mattermost.networkclient.helpers

import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.provider.OpenableColumns
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class DocumentHelper private constructor() {
    companion object {
        private const val CACHE_DIR_NAME = "NetworkClientCacheDir"
        @Volatile
        private var instance: DocumentHelper? = null

        fun getInstance(): DocumentHelper {
            return instance ?: synchronized(this) {
                instance ?: DocumentHelper().also { instance = it }
            }
        }
    }

    fun getRealPath(context: Context, uri: Uri): String? {
        if (DocumentsContract.isDocumentUri(context, uri)) {
            when {
                isExternalStorageDocument(uri) -> {
                    val docId = DocumentsContract.getDocumentId(uri)
                    val split = docId.split(":").toTypedArray()
                    val type = split[0]

                    if ("primary".equals(type, ignoreCase = true)) {
                        return "${Environment.getExternalStorageDirectory()}/${split[1]}"
                    }
                }
                isDownloadsDocument(uri) -> {
                    val id = DocumentsContract.getDocumentId(uri)
                    if (!id.isNullOrEmpty()) {
                        return if (id.startsWith("raw:")) {
                            id.removePrefix("raw:")
                        } else {
                            try {
                                return getPathFromSavingTempFile(context, uri)
                            } catch (e: NumberFormatException) {
                                null
                            }
                        }
                    }
                }
                isMediaDocument(uri) -> {
                    val docId = DocumentsContract.getDocumentId(uri)
                    val split = docId.split(":").toTypedArray()
                    val type = split[0]

                    val contentUri = when (type) {
                        "image" -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                        "video" -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                        "audio" -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                        else -> null
                    }

                    val selectionArgs = arrayOf(split[1])

                    return if (contentUri != null) {
                        getDataColumn(context, contentUri, selectionArgs)
                    } else {
                        getPathFromSavingTempFile(context, uri)
                    }
                }
            }
        }

        when {
            "content".equals(uri.scheme, ignoreCase = true) -> {
                return if (isGooglePhotosUri(uri)) {
                    uri.lastPathSegment
                } else {
                    getPathFromSavingTempFile(context, uri)
                }
            }
            "file".equals(uri.scheme, ignoreCase = true) -> {
                return uri.path
            }
        }

        return null
    }

    private fun getPathFromSavingTempFile(context: Context, uri: Uri): String? {
        var tmpFile: File? = null
        var fileName: String? = null

        if (uri.isRelative) {
            return null
        }

        try {
            val returnCursor = context.contentResolver.query(uri, null, null, null, null)
            returnCursor?.use {
                val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                it.moveToFirst()
                fileName = sanitizeFilename(it.getString(nameIndex))
            }
        } catch (e: Exception) {
            // just continue to get the filename with the last segment of the path
        }

        try {
            if (fileName.isNullOrEmpty()) {
                fileName = sanitizeFilename(uri.lastPathSegment.toString().trim())
            }

            val cacheDir = File(context.cacheDir, CACHE_DIR_NAME)
            if (!cacheDir.exists()) {
                cacheDir.mkdirs()
            }

            if (!fileName.isNullOrEmpty()) {
                tmpFile = File(cacheDir, fileName!!)
                tmpFile.createNewFile()

                val pfd = context.contentResolver.openFileDescriptor(uri, "r")
                FileInputStream(pfd!!.fileDescriptor).channel.use { src ->
                    FileOutputStream(tmpFile).channel.use { dst ->
                        dst.transferFrom(src, 0, src.size())
                    }
                }
                pfd.close()
            }
        } catch (ex: IOException) {
            return null
        }

        return tmpFile?.absolutePath
    }

    private fun getDataColumn(context: Context, uri: Uri, selectionArgs: Array<String>?): String? {
        val selection = "_id=?"
        val column = "_data"
        val projection = arrayOf(column)

        context.contentResolver.query(uri, projection, selection, selectionArgs, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndexOrThrow(column)
                return cursor.getString(index)
            }
        }
        return null
    }

    private fun isExternalStorageDocument(uri: Uri): Boolean {
        return "com.android.externalstorage.documents" == uri.authority
    }

    private fun isDownloadsDocument(uri: Uri): Boolean {
        return "com.android.providers.downloads.documents" == uri.authority
    }

    private fun isMediaDocument(uri: Uri): Boolean {
        return "com.android.providers.media.documents" == uri.authority
    }

    private fun isGooglePhotosUri(uri: Uri): Boolean {
        return "com.google.android.apps.photos.content" == uri.authority
    }

    private fun sanitizeFilename(filename: String?): String? {
        filename ?: return null
        val file = File(filename)
        return file.name
    }
}

