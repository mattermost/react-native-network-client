package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.Arguments
import com.mattermost.networkclient.ApiClientModuleImpl
import kotlin.math.roundToInt

interface ProgressListenerInterface {
    fun update(bytesRead: Double, contentLength: Double, done: Boolean?)
    fun emitProgressEvent(progress: Double, bytesRead: Double)
}

class ProgressListener(private val taskId: String, private val eventName: String) : ProgressListenerInterface {
    override fun emitProgressEvent(progress: Double, bytesRead: Double) {
        val data = Arguments.createMap()
        data.putDouble("fractionCompleted", progress)
        data.putString("taskId", taskId)
        data.putDouble("bytesRead", bytesRead)
        ApiClientModuleImpl.sendJSEvent(eventName, data)
    }

    override fun update(bytesRead: Double, contentLength: Double, done: Boolean?) {
        if (done == true) {
            emitProgressEvent(1.0, bytesRead)
        }
        var progress = 0.0
        // Only emit if we can show progress against content length
        if (contentLength > 0) progress = (bytesRead / contentLength * 100).roundToInt() / 100.0
        emitProgressEvent(progress, bytesRead)
    }
}
