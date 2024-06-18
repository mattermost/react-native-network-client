package com.mattermost.networkclient

import com.facebook.react.bridge.*

class ApiClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var implementation: ApiClientModuleImpl = ApiClientModuleImpl(reactContext)

    override fun getName(): String = ApiClientModuleImpl.NAME

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        implementation.createClientFor(baseUrl, options, promise)
    }

    @ReactMethod
    fun getClientHeadersFor(baseUrl: String, promise: Promise) {
        implementation.getClientHeadersFor(baseUrl, promise)
    }

    @ReactMethod
    fun addClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise) {
        implementation.addClientHeadersFor(baseUrl, headers, promise)
    }

    @ReactMethod
    fun importClientP12For(baseUrl: String, path: String, password: String, promise: Promise) {
        implementation.importClientP12For(baseUrl, path, password, promise)
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        implementation.invalidateClientFor(baseUrl, promise)
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap?, promise: Promise) {
        implementation.get(baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap?, promise: Promise) {
        implementation.post(baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap?, promise: Promise) {
        implementation.put(baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap?, promise: Promise) {
        implementation.patch(baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun methodDelete(baseUrl: String, endpoint: String, options: ReadableMap?, promise: Promise) {
        implementation.delete(baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun download(baseUrl: String, endpoint: String, filePath: String, taskId: String, options: ReadableMap?, promise: Promise) {
        implementation.download(baseUrl, endpoint, filePath, taskId, options, promise)
    }

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String, filePath: String, taskId: String, options: ReadableMap?, promise: Promise) {
        implementation.upload(baseUrl, endpoint, filePath, taskId, options, promise)
    }

    @ReactMethod
    fun cancelRequest(taskId: String, promise: Promise) {
        implementation.cancelRequest(taskId, promise)
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
