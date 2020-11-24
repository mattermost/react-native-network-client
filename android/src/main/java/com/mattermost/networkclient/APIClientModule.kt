package com.mattermost.networkclient

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import okhttp3.OkHttpClient

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "APIClient"
    }

    /*
    // Example method
    // See https://facebook.github.io/react-native/docs/native-modules-android
    @ReactMethod
    fun getClientsList(promise: Promise) {
        promise.resolve(sessions.keys);
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, config: ReadableMap, promise: Promise ) {
        val client = OkHttpClient().newBuilder();

        val followRedirect = config.getBoolean("followRedirect")
        if(followRedirect) client.followRedirects(followRedirect)

        val timeout = config.getInt("timeoutInterval").toLong()
        if(timeout > 0) {
            client.connectTimeout(timeout, TimeUnit.SECONDS)
        }

        sessions[baseUrl] = client.build()
        promise.resolve("")

    }

    @ReactMethod
    fun removeClientFor(baseUrl: String, promise: Promise ) {
        sessions.remove(baseUrl);
        promise.resolve("");
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise){
        val request = Request.Builder().url("${baseUrl}/${endpoint}").build();
        sessions[baseUrl]?.newCall(request)?.execute().use{ response ->
            if (response!!.isSuccessful) promise.reject("Unexpected code $response")
            promise.resolve(response)
        }
    }

   @ReactMethod
   fun getApiClientHeadersFor(baseUrl: String, promise: Promise ) {
       val build = sessions[baseUrl].
       promise.resolve(build?.headers)
   }
   @ReactMethod
   fun addApiClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise ) {
       val headers = headers.toHashMap()
       for ((k,v) in headers){
           sessions[baseUrl]?.addHeader(k,v as String);
       }
       promise.resolve("")
   }
   @ReactMethod
   fun removeApiClientHeadersFor(baseUrl: String, headers: ReadableArray, promise: Promise ) {
       val headers = headers.toArrayList();
       for (h in headers){
           sessions[baseUrl]?.removeHeader(h as String);
       }
       promise.resolve("")
   }
   @ReactMethod
   fun clearApiClientHeadersFor(baseUrl: String, promise: Promise){
       val build = sessions[baseUrl]?.build()
       build?.headers?.forEach { (k,v) -> sessions[baseUrl]?.removeHeader(k) }
       promise.resolve("")
   }
   @ReactMethod
   fun post(baseUrl: String, endpoint: String?, options: ReadableMap, promise: Promise){
       val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.post(options.toString().toRequestBody())?.build();
       client.newCall(request!!).execute().use{ response ->
           if (!response.isSuccessful) promise.reject("Unexpected code $response")
           promise.resolve(response)
       }
   }
   @ReactMethod
   fun put(baseUrl: String, endpoint: String?, options: ReadableMap, promise: Promise){
       val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.put(options.toString().toRequestBody())?.build();
       client.newCall(request!!).execute().use{ response ->
           if (!response.isSuccessful) promise.reject("Unexpected code $response")
           promise.resolve(response)
       }
   }
   @ReactMethod
   fun patch(baseUrl: String, endpoint: String?, options: ReadableMap, promise: Promise){
       val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.patch(options.toString().toRequestBody())?.build();
       client.newCall(request!!).execute().use{ response ->
           if (!response.isSuccessful) promise.reject("Unexpected code $response")
           promise.resolve(response)
       }
   }
   @ReactMethod
   fun delete(baseUrl: String, endpoint: String?, options: ReadableMap, promise: Promise){
       val request = sessions[baseUrl]?.url("${baseUrl}/${endpoint}")?.delete(options.toString().toRequestBody())?.build();
       client.newCall(request!!).execute().use{ response ->
           if (!response.isSuccessful) promise.reject("Unexpected code $response")
           promise.resolve(response)
       }
   }
   */

}
