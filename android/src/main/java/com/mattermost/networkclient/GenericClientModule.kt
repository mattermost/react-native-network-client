package com.mattermost.networkclient

import com.facebook.react.bridge.*

class GenericClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var client = NetworkClient();

    override fun getName(): String {
        return "GenericClient"
    }

    @ReactMethod
    fun get(url: String, options: ReadableMap, promise: Promise) {
        client.request("get", url, options).use { response ->
            promise.resolve(response.returnAsWriteableMap())
        }
    }

    @ReactMethod
    fun post(url: String, options: ReadableMap, promise: Promise) {
        client.request("post", url, options).use { response ->
            promise.resolve(response.returnAsWriteableMap())
        }
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap, promise: Promise) {
        client.request("put", url, options).use { response ->
            promise.resolve(response.returnAsWriteableMap())
        }
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap, promise: Promise) {
        client.request("patch", url, options).use { response ->
            promise.resolve(response.returnAsWriteableMap())
        }
    }

    @ReactMethod
    fun delete(url: String, options: ReadableMap, promise: Promise) {
        client.request("delete", url, options).use { response ->
            promise.resolve(response.returnAsWriteableMap())
        }
    }

}
