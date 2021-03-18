package com.mattermost.networkclient.helpers

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mattermost.networkclient.enums.APIClientEvents

interface ProgressListenerInterface {
    fun update(bytesRead: Double, contentLength: Double)
    fun emitProgressEvent(progress: Double)
}

class ProgressListener(private val reactContext: ReactContext, private val taskId: String) : ProgressListenerInterface {

    override fun emitProgressEvent(progress: Double) {
        val params = Arguments.createMap()
        params.putDouble("fractionCompleted", progress)
        params.putString("taskId", "$taskId")
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(APIClientEvents.UPLOAD_PROGRESS.event, params)
    }

    override fun update(bytesRead: Double, contentLength: Double) {
        val progress = bytesRead / contentLength;
        emitProgressEvent(progress)
    }
}
