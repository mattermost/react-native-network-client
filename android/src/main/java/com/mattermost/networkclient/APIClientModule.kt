package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okio.IOException

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
            sessionsClient[baseUrl]!!.parseOptions(options);

            // Return stringified client for success
            promise.resolve( null)
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
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").post(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").put(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").patch(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").delete(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String?, fileUrl: String, taskId: String, options: ReadableMap, promise: Promise) {

    }

    @ReactMethod
    fun cancelRequest(taskId: String) {

    }
}
