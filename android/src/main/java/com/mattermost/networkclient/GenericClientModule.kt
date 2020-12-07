package com.mattermost.networkclient

import com.facebook.react.bridge.*
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response


class GenericClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var client = OkHttpClient();

    override fun getName(): String {
        return "GenericClient"
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
    fun get(baseUrl: String, options: ReadableMap, promise: Promise){
        val request = Request.Builder().url(baseUrl).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun post(baseUrl: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(baseUrl).post(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun put(baseUrl: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(baseUrl).put(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(baseUrl).patch(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(baseUrl).delete(body).build();
        client.newCall(request).execute().use{ response ->
            if (response.isSuccessful) {
                val res = parseResponse(response);
                return promise.resolve(res)
            }
            promise.reject("Unexpected code $response")
        }
    }

}
