package com.mattermost.networkclient

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
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
        promise.resolve("")
    }

    @ReactMethod
    fun removeApiClientFor(baseUrl: String, promise: Promise ) {
        sessions.remove(baseUrl);
        promise.resolve("");
    }

    @ReactMethod
    fun getApiClientHeadersFor(baseUrl: String, promise: Promise ) {
    }

    @ReactMethod
    fun addApiClientHeadersFor(baseUrl: String, headers: Headers, promise: Promise ) {
        promise.resolve(sessions[baseUrl]?.headers(headers))
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String?, options: Object, promise: Promise){
        val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.build();
        client.newCall(request!!).execute().use{ response ->
            if (!response.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String?, options: Object, promise: Promise){

    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String?, options: Object, promise: Promise){}

    @ReactMethod
    fun path(baseUrl: String, endpoint: String?, options: Object, promise: Promise){}

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String?, options: Object, promise: Promise){}

    
}
