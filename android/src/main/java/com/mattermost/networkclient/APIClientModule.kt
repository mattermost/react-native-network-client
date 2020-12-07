package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;


class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var client = OkHttpClient();
    var sessions = mutableMapOf<String, Request.Builder>()

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, config: ReadableMap, promise: Promise){
        sessions[baseUrl] = Request.Builder().url(baseUrl);
        promise.resolve("");
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
        val headers = headers.toHashMap()
        for ((k,v) in headers){
            sessions[baseUrl]!!.addHeader(k,v as String);
        }
        promise.resolve("")
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise){
        sessions.remove(baseUrl);
        promise.resolve("");
    }

    private fun parseResponse(response: Response): WritableMap {
        val headers = Arguments.createMap();
        response.headers.forEach{ k -> headers.putString(k.first, k.second) }

        val map = Arguments.createMap()
        map.putMap("headers", headers)
        map.putString("data", response.body!!.string())
        map.putInt("code", response.code)
        return map;
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").post(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").put(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").patch(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = sessions[baseUrl]!!.url("$baseUrl/$endpoint").delete(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }
}
