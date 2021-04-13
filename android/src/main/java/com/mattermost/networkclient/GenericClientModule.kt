package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.helpers.bodyToRequestBody
import com.mattermost.networkclient.helpers.parseOptions
import com.mattermost.networkclient.helpers.returnAsWriteableMap
import com.mattermost.networkclient.interceptors.RetryInterceptor
import okhttp3.OkHttpClient
import okhttp3.Request


class GenericClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var client = OkHttpClient().newBuilder();

    override fun getName(): String {
        return "GenericClient"
    }

    init {
        client.addInterceptor(RetryInterceptor("generic"))
    }

    @ReactMethod
    fun get(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).parseOptions(options, client, url).build();
        client.build().newCall(request).execute().use { response ->
            promise.resolve(response.returnAsWriteableMap("generic"))
        }
    }

    @ReactMethod
    fun post(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).post(options.bodyToRequestBody()).parseOptions(options, client, url).build();
        client.build().newCall(request).execute().use { response ->
            promise.resolve(response.returnAsWriteableMap("generic"))
        }
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).put(options.bodyToRequestBody()).parseOptions(options, client, url).build();
        client.build().newCall(request).execute().use { response ->
            promise.resolve(response.returnAsWriteableMap("generic"))
        }
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).patch(options.bodyToRequestBody()).parseOptions(options, client, url).build();
        client.build().newCall(request).execute().use { response ->
            promise.resolve(response.returnAsWriteableMap("generic"))
        }
    }

    @ReactMethod
    fun delete(url: String, options: ReadableMap, promise: Promise) {
        val request = Request.Builder().url(url).delete(options.bodyToRequestBody()).parseOptions(options, client, url).build();
        client.build().newCall(request).execute().use { response ->
            promise.resolve(response.returnAsWriteableMap("generic"))
        }
    }

}
