package com.mattermost.networkclient

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

internal class WebSocketClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var implementation: WebSocketClientModuleImpl = WebSocketClientModuleImpl(reactContext)

    override fun getName(): String = WebSocketClientModuleImpl.NAME

    override fun invalidate() {
        super.invalidate()
        implementation.invalidate()
    }

    @ReactMethod
    fun ensureClientFor(wsUrl: String, options: ReadableMap, promise: Promise) {
        implementation.ensureClientFor(wsUrl, options, promise)
    }

    @ReactMethod
    fun createClientFor(wsUrl: String, options: ReadableMap, promise: Promise) {
        implementation.createClientFor(wsUrl, options, promise)
    }

    @ReactMethod
    fun invalidateClientFor(wsUrl: String, promise: Promise) {
        implementation.invalidateClientFor(wsUrl, promise)
    }

    @ReactMethod
    fun connectFor(wsUrl: String, promise: Promise) {
        implementation.connectFor(wsUrl, promise)
    }

    @ReactMethod
    fun disconnectFor(wsUrl: String, promise: Promise) {
        implementation.disconnectFor(wsUrl, promise)
    }

    @ReactMethod
    fun sendDataFor(wsUrl: String, data: String, promise: Promise) {
        implementation.sendDataFor(wsUrl, data, promise)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built in Event Emitter Calls
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls
    }

}
