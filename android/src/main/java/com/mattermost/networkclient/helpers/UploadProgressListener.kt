package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.Arguments
import com.mattermost.networkclient.APIClientModule
import com.mattermost.networkclient.enums.APIClientEvents
import java.math.RoundingMode
import java.text.DecimalFormat

interface ProgressListenerInterface {
    fun update(bytesRead: Double, contentLength: Double)
    fun emitProgressEvent(progress: Double, bytesRead: Double)
}

class ProgressListener(private val taskId: String) : ProgressListenerInterface {
    // 2-Decimal places, rounded up
    private val df = DecimalFormat("#.00", ).apply{ roundingMode = RoundingMode.UP }

    override fun emitProgressEvent(progress: Double, bytesRead: Double) {
        val data = Arguments.createMap()
        data.putDouble("fractionCompleted", progress)
        data.putString("taskId", "$taskId")
        data.putDouble("bytesRead", bytesRead)
        APIClientModule.sendJSEvent(APIClientEvents.UPLOAD_PROGRESS.event, data)
    }

    override fun update(bytesRead: Double, contentLength: Double) {
        var progress = 0.0;
        // Only emit if we can show progress against content length
        if(contentLength > 0) progress = df.format(bytesRead / contentLength).toDouble()
        emitProgressEvent(progress, bytesRead)
    }
}
