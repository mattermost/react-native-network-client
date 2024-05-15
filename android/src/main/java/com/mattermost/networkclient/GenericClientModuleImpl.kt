package com.mattermost.networkclient

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import java.lang.Exception

class GenericClientModuleImpl(reactApplicationContext: ReactApplicationContext) {
    private var client = NetworkClient(reactApplicationContext)

    companion object {
        const val NAME = "GenericClient"
    }

    fun head(url: String, options: ReadableMap?, promise: Promise) {
        request("HEAD", url, options, promise)
    }

    fun get(url: String, options: ReadableMap?, promise: Promise) {
        request("GET", url, options, promise)
    }

    fun post(url: String, options: ReadableMap?, promise: Promise) {
        request("POST", url, options, promise)
    }

    fun put(url: String, options: ReadableMap?, promise: Promise) {
        request("PUT", url, options, promise)
    }

    fun patch(url: String, options: ReadableMap?, promise: Promise) {
        request("PATCH", url, options, promise)
    }

    fun delete(url: String, options: ReadableMap?, promise: Promise) {
        request("DELETE", url, options, promise)
    }

    private fun request(method: String, url: String, options: ReadableMap?, promise: Promise) {
        try {
            client.request(method, url, options, promise)
        } catch (error: Exception) {
            return promise.reject(error)
        }
    }
}
