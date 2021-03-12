package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okio.IOException
import java.util.*

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var sessionsClient = mutableMapOf<String, OkHttpClient.Builder>()
    var sessionsRequest = mutableMapOf<String, Request.Builder>()

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        try {
            // Create the client and request builder
            sessionsClient[baseUrl] = OkHttpClient().newBuilder();
            sessionsRequest[baseUrl] = Request.Builder().url(baseUrl);

            // Attach client options if they are passed in
            sessionsClient[baseUrl]!!.parseOptions(options, sessionsRequest[baseUrl]);

            // Return stringified client for success
            promise.resolve(null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun getClientHeadersFor(baseUrl: String, promise: Promise) {
        try {
            promise.resolve(sessionsRequest[baseUrl]?.build()?.headers?.readableMap())
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun addClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise) {
        try {
            sessionsRequest[baseUrl]?.addReadableMap(headers)
            promise.resolve(null);
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        try {
            sessionsRequest.remove(baseUrl);
            promise.resolve(sessionsRequest.keys);
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val request = sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val request = sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).post(options.bodyToRequestBody()).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val request = sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).put(options.bodyToRequestBody()).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val request = sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).patch(options.bodyToRequestBody()).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val request = sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).delete(options.bodyToRequestBody()).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()
        constants["EXPONENTIAL_RETRY"] = "EXPONENTIAL_RETRY"
        return constants
    }
}
