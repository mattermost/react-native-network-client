package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody


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
        val body = options.getMap("body").toString().toRequestBody();
        val request = Request.Builder().url(url).post(body).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap, promise: Promise) {
        val body = options.getMap("body").toString().toRequestBody();
        val request = Request.Builder().url(url).put(body).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap, promise: Promise) {
        val body = options.getMap("body").toString().toRequestBody();
        val request = Request.Builder().url(url).patch(body).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

    @ReactMethod
    fun delete(url: String, options: ReadableMap, promise: Promise) {
        val body = options.getMap("body").toString().toRequestBody();
        val request = Request.Builder().url(url).delete(body).parseOptions(options, client).build();
        client.build().newCall(request).execute().use { response ->
            response.promiseResolution(promise)
        }
    }

}
