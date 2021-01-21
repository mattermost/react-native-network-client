package com.mattermost.networkclient.uploads

interface ProgressListenerInterface {
    fun update(bytesRead: Long, contentLength: Long)
    fun emitProgressEvent(progress: Int)
}
