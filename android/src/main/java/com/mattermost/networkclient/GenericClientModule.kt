package com.mattermost.networkclient

import com.facebook.react.bridge.*
import java.lang.Exception

internal class GenericClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var client = NetworkClient()

    override fun getName(): String {
        return "GenericClient"
    }

    @ReactMethod
    fun head(url: String, options: ReadableMap?, promise: Promise) {
        request("HEAD", url, options, promise)
    }

    @ReactMethod
    fun get(url: String, options: ReadableMap?, promise: Promise) {
        request("GET", url, options, promise)
    }

    @ReactMethod
    fun post(url: String, options: ReadableMap?, promise: Promise) {
        request("POST", url, options, promise)
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap?, promise: Promise) {
        request("PUT", url, options, promise)
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap?, promise: Promise) {
        request("PATCH", url, options, promise)
    }

    @ReactMethod
    fun delete(url: String, options: ReadableMap?, promise: Promise) {
        request("DELETE", url, options, promise)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built in Event Emitter Calls
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls
    }

    private fun request(method: String, url: String, options: ReadableMap?, promise: Promise) {
        try {
            client.request(method, url, options, promise)
        } catch (error: Exception) {
            return promise.reject(error)
        }
    }
}
