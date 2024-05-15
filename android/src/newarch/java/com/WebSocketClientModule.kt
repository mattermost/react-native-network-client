package com.mattermost.networkclient

import com.facebook.fbreact.specs.NativeWebSocketClientSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap

internal class WebSocketClientModule(reactContext: ReactApplicationContext) : NativeWebSocketClientSpec(reactContext) {
    private var implementation: WebSocketClientModuleImpl = WebSocketClientModuleImpl(reactContext)

    override fun getName(): String = WebSocketClientModuleImpl.NAME

    override fun invalidate() {
        super.invalidate()
        implementation.invalidate()
    }

    override fun addListener(eventType: String?) {
        // Keep: Required for RN built in Event Emitter Calls
    }

    override fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls
    }

    override fun ensureClientFor(url: String?, config: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || config == null || promise == null) {
            promise?.reject(Exception("missing parameter to create client"))
            return
        }
        implementation.ensureClientFor(url, config, promise)
    }

    override fun createClientFor(url: String?, config: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || config == null || promise == null) {
            promise?.reject(Exception("missing parameter to create client"))
            return
        }
        implementation.createClientFor(url, config, promise)
    }

    override fun connectFor(url: String?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("missing parameter to connect client"))
            return
        }
        implementation.connectFor(url, promise)
    }

    override fun disconnectFor(url: String?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("missing parameter to disconnect client"))
            return
        }
        implementation.disconnectFor(url, promise)
    }

    override fun sendDataFor(url: String?, data: String?, promise: Promise?) {
        if (url.isNullOrEmpty() || data.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("missing parameter to send data"))
            return
        }
        implementation.sendDataFor(url, data, promise)
    }

    override fun invalidateClientFor(url: String?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("missing parameter to invalidate client"))
            return
        }
        implementation.invalidateClientFor(url, promise)
    }

}
