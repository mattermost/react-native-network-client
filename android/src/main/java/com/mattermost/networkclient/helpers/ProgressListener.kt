package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.Arguments
import com.mattermost.networkclient.APIClientModule
import java.math.RoundingMode
import java.text.DecimalFormat

interface ProgressListenerInterface {
    fun update(bytesRead: Double, contentLength: Double, done: Boolean?)
    fun emitProgressEvent(progress: Double, bytesRead: Double)
}

class ProgressListener(private val taskId: String, private val eventName: String) : ProgressListenerInterface {
    // 2-Decimal places, rounded up
    private val df = DecimalFormat("#.00", ).apply{ roundingMode = RoundingMode.UP }

    override fun emitProgressEvent(progress: Double, bytesRead: Double) {
        val data = Arguments.createMap()
        data.putDouble("fractionCompleted", progress)
        data.putString("taskId", "$taskId")
        data.putDouble("bytesRead", bytesRead)
        APIClientModule.sendJSEvent(eventName, data)
    }

    override fun update(bytesRead: Double, contentLength: Double, done: Boolean?) {
        if (done !== null && done) {
            emitProgressEvent(1.0, bytesRead)
        }
        var progress = 0.0;
        // Only emit if we can show progress against content length
        if(contentLength > 0) progress = df.format(bytesRead / contentLength).toDouble()
        emitProgressEvent(progress, bytesRead)
    }
}
