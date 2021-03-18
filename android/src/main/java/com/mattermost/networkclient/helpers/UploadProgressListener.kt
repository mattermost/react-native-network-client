package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mattermost.networkclient.enums.APIClientEvents
import java.math.RoundingMode
import java.text.DecimalFormat

interface ProgressListenerInterface {
    fun update(bytesRead: Double, contentLength: Double)
    fun emitProgressEvent(progress: Double)
}

class ProgressListener(private val reactContext: ReactContext, private val taskId: String) : ProgressListenerInterface {
    // 2-Decimal places, rounded up
    private val df = DecimalFormat("#.00", ).apply{ roundingMode = RoundingMode.UP }

    override fun emitProgressEvent(progress: Double) {
        val params = Arguments.createMap()
        params.putDouble("fractionCompleted", progress)
        params.putString("taskId", "$taskId")
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(APIClientEvents.UPLOAD_PROGRESS.event, params)
    }

    override fun update(bytesRead: Double, contentLength: Double) {
        // Only emit if we can show progress against content length
        if(contentLength > 0) emitProgressEvent(df.format(bytesRead / contentLength).toDouble())
    }
}
