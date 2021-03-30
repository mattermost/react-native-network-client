package com.mattermost.networkclient

import android.net.Uri
import com.facebook.react.bridge.*
import okhttp3.*
import okio.*
import com.mattermost.networkclient.enums.APIClientEvents
import com.mattermost.networkclient.helpers.*
import kotlin.collections.HashMap

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var sessionsClient = mutableMapOf<String, OkHttpClient.Builder>()
    var sessionsRequest = mutableMapOf<String, Request.Builder>()
    var calls = mutableMapOf<String, Call>()

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
            sessionsRequest[baseUrl]?.addHeadersAsReadableMap(headers)
            promise.resolve(null);
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        try {
            sessionsRequest.remove(baseUrl);
            sessionsClient.remove(baseUrl);
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

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String, file: String, taskId: String, options: ReadableMap?, promise: Promise) {
        val body: RequestBody;
        val uri = Uri.parse(file);

        // check for multi-parts options
        if(options != null && options.hasKey("multipart")){
            val multipartOptions = options.getMap("multipart")!!

            val multipartBody = MultipartBody.Builder();
            multipartBody.setType(MultipartBody.FORM)

            if(multipartOptions.hasKey("fileKey") && multipartOptions.getString("fileKey") != ""){
                multipartBody.addFormDataPart(multipartOptions.getString("fileKey")!!, uri.lastPathSegment, UploadFileRequestBody(reactApplicationContext, uri, 0, ProgressListener(reactApplicationContext, taskId)))
            } else {
                multipartBody.addFormDataPart("files", uri.lastPathSegment, UploadFileRequestBody(reactApplicationContext, uri, 0, ProgressListener(reactApplicationContext, taskId)))
            }

            if(multipartOptions.hasKey("data")){
                val multipartData = multipartOptions.getMap("data")!!.toHashMap();
                for( (k, v) in multipartData){
                    multipartBody.addFormDataPart(k, v as String);
                }
            }

            body = multipartBody.build()
        } else {
            val skipBytes = if (options != null && options.hasKey("skipBytes")) options.getInt("skipBytes").toLong() else 0;
            body = UploadFileRequestBody(reactApplicationContext, Uri.parse(file), skipBytes, ProgressListener(reactApplicationContext, taskId))
        }

        try {
            // Create a Request
            var request = if(options?.hasKey("method") == true) {
                when (options.getString("method")) {
                    "PUT" -> sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).put(body)
                    "PATCH" -> sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).patch(body)
                    // Default to "POST"
                    else -> sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).post(body)
                }
            } else {
                sessionsRequest[baseUrl]!!.url(formUrlString(baseUrl, endpoint)).post(body)
            }

            // Parse options into the request / client
            if (options != null) request = request.parseOptions(options, sessionsClient[baseUrl]!!)

            // Create a cancellable call
            calls[taskId] = sessionsClient[baseUrl]!!.build().newCall(request.build())

            // Execute the call!
            calls[taskId]!!.execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun cancelRequest(taskId: String, promise: Promise) {
        try {
            calls[taskId]!!.cancel()
            promise.resolve(null)
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()
        constants["RETRY_TYPES"] = hashMapOf("EXPONENTIAL_RETRY" to "exponential")

        // APIClient Events
        val events = HashMap<String, String>()
        APIClientEvents.values().forEach { enum -> events[enum.name] = enum.event }
        constants["EVENTS"] = events
        return constants
    }
}
