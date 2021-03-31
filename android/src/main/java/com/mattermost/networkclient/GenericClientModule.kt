package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.helpers.bodyToRequestBody
import com.mattermost.networkclient.helpers.parseOptions
import com.mattermost.networkclient.helpers.promiseResolution
import okhttp3.OkHttpClient
import okhttp3.Request


class GenericClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var client = OkHttpClient().newBuilder();

    override fun getName(): String {
        return "GenericClient"
    }

    @ReactMethod
    fun get(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun post(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).post(options.bodyToRequestBody()).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).put(options.bodyToRequestBody()).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).patch(options.bodyToRequestBody()).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun delete(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).delete(options.bodyToRequestBody()).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

}
