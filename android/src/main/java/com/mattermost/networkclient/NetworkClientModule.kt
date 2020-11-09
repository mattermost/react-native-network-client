package com.mattermost.networkclient

import com.facebook.react.bridge.*

import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request

class NetworkClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    val client = OkHttpClient();
    var sessions = mutableMapOf<String, Request.Builder>()

    override fun getName(): String {
        return "NetworkClient"
    }

    // Returns a list of all network sessions
    @ReactMethod
    fun getApiClientsList(promise: Promise) {
        promise.resolve(sessions.keys);
    }

    @ReactMethod
    fun createApiClientFor(baseUrl: String, config: Object, promise: Promise ) {
        // @to-do: try/catch
        sessions[baseUrl] = Request.Builder().url(baseUrl);
        promise.resolve(void)
    }

    @ReactMethod
    fun removeApiClientFor(baseUrl: String, promise: Promise ) {
        sessions.remove(baseUrl);
        promise.resolve(void);
    }

    @ReactMethod
    fun getApiClientHeadersFor(baseUrl: String, promise: Promise ) {
        val build = sessions[baseUrl]?.build()
        promise.resolve(build?.headers)
    }

    @ReactMethod
    fun addApiClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise ) {
        val headers = headers.toHashMap()
        for ((k,v) in headers){
            sessions[baseUrl]?.addHeader(k,v as String);
        }
        promise.resolve(void)
    }

    @ReactMethod
    fun removeApiClientHeadersFor(baseUrl: String, headers: ReadableArray, promise: Promise ) {
        val headers = headers.toArrayList();
        for (h in headers){
            sessions[baseUrl]?.removeHeader(h as String);
        }
        promise.resolve(void)
    }

    @ReactMethod
    fun clearApiClientHeadersFor(baseUrl: String, promise: Promise){
        val build = sessions[baseUrl]?.build()
        build?.headers?.forEach { (k,v) -> sessions[baseUrl]?.removeHeader(k) }
        promise.resolve(void)
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String?, options: ReadableMap, promise: Promise){
        val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.build();
        client.newCall(request!!).execute().use{ response ->
            if (!response.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String?, options: kotlin.Any, promise: Promise){
        val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.post(options)?.build();
        client.newCall(request!!).execute().use{ response ->
            if (!response.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String?, options: Object, promise: Promise){
        val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.put(options)?.build();
        client.newCall(request!!).execute().use{ response ->
            if (!response.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String?, options: Object, promise: Promise){
        val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.patch(options)?.build();
        client.newCall(request!!).execute().use{ response ->
            if (!response.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String?, options: Object, promise: Promise){
        val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.delete(options.body)?.build();
        client.newCall(request!!).execute().use{ response ->
            if (!response.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

    
}
