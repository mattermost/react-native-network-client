package com.mattermost.networkclient

import com.facebook.react.bridge.*
import java.lang.Exception

internal class GenericClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var implementation: GenericClientModuleImpl = GenericClientModuleImpl(reactContext)

    override fun getName(): String = GenericClientModuleImpl.NAME

    @ReactMethod
    fun head(url: String, options: ReadableMap?, promise: Promise) {
        implementation.head(url, options, promise)
    }

    @ReactMethod
    fun get(url: String, options: ReadableMap?, promise: Promise) {
        implementation.get(url, options, promise)
    }

    @ReactMethod
    fun post(url: String, options: ReadableMap?, promise: Promise) {
        implementation.post(url, options, promise)
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap?, promise: Promise) {
        implementation.put(url, options, promise)
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap?, promise: Promise) {
        implementation.patch(url, options, promise)
    }

    @ReactMethod
    fun methodDelete(url: String, options: ReadableMap?, promise: Promise) {
        implementation.delete(url, options, promise)
    }
}
