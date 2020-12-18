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
    fun get(url: String, options: ReadableMap, promise: Promise){
        val request = Request.Builder().url(url).build();
        client.newCall(request).execute().use{ response ->
            val res = parseResponse(response);
            if (response.isSuccessful) {
                promise.resolve(res)
            } else {
                promise.reject(response.code.toString(), res)
            }
        }
    }

    @ReactMethod
    fun post(url: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(url).post(body).build();
        client.newCall(request).execute().use{ response ->
            val res = parseResponse(response);
            if (response.isSuccessful) {
                promise.resolve(res)
            } else {
                promise.reject(response.code.toString(), res)
            }
        }
    }

    @ReactMethod
    fun put(url: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(url).put(body).build();
        client.newCall(request).execute().use{ response ->
            val res = parseResponse(response);
            if (response.isSuccessful) {
                promise.resolve(res)
            } else {
                promise.reject(response.code.toString(), res)
            }
        }
    }

    @ReactMethod
    fun patch(url: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(url).patch(body).build();
        client.newCall(request).execute().use{ response ->
            val res = parseResponse(response);
            if (response.isSuccessful) {
                promise.resolve(res)
            } else {
                promise.reject(response.code.toString(), res)
            }
        }
    }

    @ReactMethod
    fun delete(url: String, options: ReadableMap, promise: Promise){
        val body = options.toString().toRequestBody();
        val request = Request.Builder().url(url).delete(body).build();
        client.newCall(request).execute().use{ response ->
            val res = parseResponse(response);
            if (response.isSuccessful) {
                promise.resolve(res)
            } else {
                promise.reject(response.code.toString(), res)
            }
        }
    }

}
