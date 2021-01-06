package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import com.facebook.react.bridge.Arguments;

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var client = OkHttpClient();
    var sessions = mutableMapOf<String, Request.Builder>()

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, config: ReadableMap, promise: Promise){
        try {
            sessions[baseUrl] = Request.Builder().url(baseUrl);
            promise.resolve(sessions[baseUrl]);
        } catch (err: Throwable){
            promise.reject(err)
        }
    }

    @ReactMethod
    fun getClientHeadersFor(baseUrl: String, promise: Promise){
        try {
            val headersMap = Arguments.createMap()
            sessions[baseUrl]!!.build().headers.forEach{(k,v) -> headersMap.putString(k, v)}
            promise.resolve(headersMap)
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun addClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise){
        for ((k,v) in headers.toHashMap()){
            sessions[baseUrl]!!.addHeader(k,v as String);
        }
        val headersMap = Arguments.createMap()
        sessions[baseUrl]!!.build().headers.forEach{(k,v) -> headersMap.putString(k, v)}
        promise.resolve(headersMap)
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise){
        try {
            sessions.remove(baseUrl);
            promise.resolve(sessions.keys);
        } catch (err: Throwable){
            promise.reject(err)
        }
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").build();
        client.newCall(request).execute().use{ response ->
            response.handleViaPromise(promise)
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").post(body).build();
        client.newCall(request).execute().use{ response ->
            response.handleViaPromise(promise)
        }
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").put(body).build();
        client.newCall(request).execute().use{ response ->
            response.handleViaPromise(promise)
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").patch(body).build();
        client.newCall(request).execute().use{ response ->
            response.handleViaPromise(promise)
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").delete(body).build();
        client.newCall(request).execute().use{ response ->
            response.handleViaPromise(promise)
        }
    }
}
