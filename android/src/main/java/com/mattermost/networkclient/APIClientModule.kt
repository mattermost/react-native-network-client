package com.mattermost.networkclient

import android.net.Uri
import com.facebook.react.bridge.*
import okhttp3.*
import okio.*
import com.mattermost.networkclient.enums.APIClientEvents
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.helpers.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import kotlin.collections.HashMap

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val sessionsClient = SessionsObject.client
    private val sessionsCall = SessionsObject.call
    private val sessionsConfig = SessionsObject.requestConfig

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            // Create the client and request builder
            sessionsClient[url] = OkHttpClient().newBuilder();
            sessionsConfig[url] = hashMapOf("baseUrl" to url);

            // Attach client options if they are passed in
            sessionsClient[url]!!.applyClientOptions(options, url);

            promise.resolve(null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun getClientHeadersFor(baseUrl: String, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        val headers = SessionsObject.requestConfig[url]!!["clientHeaders"] as ReadableMap?
        val map = Arguments.createMap();

        if(headers != null){
            for((k, v) in headers.toHashMap()){
                map.putString(k, v as String)
            }
        }

        try {
            promise.resolve(map)
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun addClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            SessionsObject.requestConfig[url]!!["clientHeaders"] = headers
            promise.resolve(null);
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            sessionsClient.remove(url);
            sessionsConfig.remove(url);
            promise.resolve(sessionsClient.keys);
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            val request = Request.Builder()
                    .url(formUrlString(url, endpoint))
                    .applyClientOptions(url)
                    .applyRequestOptions(options, url)
                    .build();
            sessionsClient[url]!!
                    .build()
                    .newCall(request)
                    .execute().use { response ->
                        promise.resolve(response.returnAsWriteableMap())
                    }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            val request = Request.Builder()
                    .url(formUrlString(url, endpoint))
                    .applyClientOptions(url)
                    .applyRequestOptions(options, url)
                    .post(options.getMap("body")!!.bodyToRequestBody())
                    .build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap())
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            val request = Request.Builder()
                    .url(formUrlString(url, endpoint))
                    .applyClientOptions(url)
                    .applyRequestOptions(options, url)
                    .put(options.getMap("body")!!.bodyToRequestBody())
                    .build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap())
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            val request = Request.Builder()
                    .url(formUrlString(url, endpoint))
                    .applyClientOptions(url)
                    .applyRequestOptions(options, url)
                    .patch(options.getMap("body")!!.bodyToRequestBody())
                    .build();

            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap())
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            val request = Request.Builder()
                    .url(formUrlString(url, endpoint))
                    .applyClientOptions(url)
                    .applyRequestOptions(options, url)
                    .delete(options.getMap("body")!!.bodyToRequestBody())
                    .build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap())
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String, file: String, taskId: String, options: ReadableMap?, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        val body: RequestBody;
        val uri = Uri.parse(file);

        // check for multi-parts options
        if (options != null && options.hasKey("multipart")) {
            val multipartOptions = options.getMap("multipart")!!

            val multipartBody = MultipartBody.Builder();
            multipartBody.setType(MultipartBody.FORM)

            if (multipartOptions.hasKey("fileKey") && multipartOptions.getString("fileKey") != "") {
                multipartBody.addFormDataPart(multipartOptions.getString("fileKey")!!, uri.lastPathSegment, UploadFileRequestBody(reactApplicationContext, uri, 0, ProgressListener(reactApplicationContext, taskId)))
            } else {
                multipartBody.addFormDataPart("files", uri.lastPathSegment, UploadFileRequestBody(reactApplicationContext, uri, 0, ProgressListener(reactApplicationContext, taskId)))
            }

            if (multipartOptions.hasKey("data")) {
                val multipartData = multipartOptions.getMap("data")!!.toHashMap();
                for ((k, v) in multipartData) {
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
            var request = if (options?.hasKey("method") == true) {
                when (options.getString("method")) {
                    "PUT" -> Request.Builder().url(formUrlString(url, endpoint)).put(body)
                    "PATCH" -> Request.Builder().url(formUrlString(url, endpoint)).patch(body)
                    // Default to "POST"
                    else -> Request.Builder().url(formUrlString(url, endpoint)).post(body)
                }
            } else {
                Request.Builder().url(formUrlString(url, endpoint)).post(body)
            }

            // Parse options into the request / client
            if (options != null) request = request.applyClientOptions(url).applyRequestOptions(options, url)

            // Create a cancellable call
            sessionsCall[taskId] = sessionsClient[url]!!.build().newCall(request.build())

            // Execute the call!
            sessionsCall[taskId]!!.execute().use { response ->
                promise.resolve(response.returnAsWriteableMap())
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun cancelRequest(taskId: String, promise: Promise) {
        try {
            sessionsCall[taskId]!!.cancel()
            promise.resolve(null)
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()

        // APIClient Events
        val events = HashMap<String, String>()
        APIClientEvents.values().forEach { enum -> events[enum.name] = enum.event }
        constants["EVENTS"] = events

        // Retry Types
        val retryTypes = HashMap<String, String>()
        RetryTypes.values().forEach { enum -> retryTypes[enum.name] = enum.type }
        constants["RETRY_TYPES"] = retryTypes

        return constants
    }
}
