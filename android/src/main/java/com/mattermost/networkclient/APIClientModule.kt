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
    private val sessionsRequest = SessionsObject.request
    private val sessionsCall = SessionsObject.call
    private val sessionsConfig = SessionsObject.config

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            // Create the client and request builder
            sessionsClient[url] = OkHttpClient().newBuilder();
            sessionsRequest[url] = Request.Builder().url(url);
            sessionsConfig[url] = hashMapOf("baseUrl" to url);

            // Attach client options if they are passed in
            sessionsClient[url]!!.parseOptions(options, sessionsRequest[url], url);

            promise.resolve(null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun getClientHeadersFor(baseUrl: String, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            promise.resolve(sessionsRequest[url]?.build()?.headers?.readableMap())
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun addClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            sessionsRequest[url]?.addHeadersAsReadableMap(headers)
            promise.resolve(null);
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            sessionsRequest.remove(url);
            sessionsClient.remove(url);
            sessionsConfig.remove(url);
            promise.resolve(sessionsRequest.keys);
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            val request = sessionsRequest[url]!!.url(formUrlString(url, endpoint)).parseOptions(options, sessionsClient[url]!!, url).build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap(url))
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            val request = sessionsRequest[url]!!.url(formUrlString(url, endpoint)).post(options.bodyToRequestBody()).parseOptions(options, sessionsClient[url]!!, url).build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap(url))
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            val request = sessionsRequest[url]!!.url(formUrlString(url, endpoint)).put(options.bodyToRequestBody()).parseOptions(options, sessionsClient[url]!!, url).build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap(url))
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            val request = sessionsRequest[url]!!.url(formUrlString(url, endpoint)).patch(options.bodyToRequestBody()).parseOptions(options, sessionsClient[url]!!, url).build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap(url))
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();

        try {
            val request = sessionsRequest[url]!!.url(formUrlString(url, endpoint)).delete(options.bodyToRequestBody()).parseOptions(options, sessionsClient[url]!!, url).build();
            sessionsClient[url]!!.build().newCall(request).execute().use { response ->
                promise.resolve(response.returnAsWriteableMap(url))
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String, file: String, taskId: String, options: ReadableMap?, promise: Promise) {

        // Don't trust user input...
        val url = baseUrl.toHttpUrl().toString();
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
                    "PUT" -> sessionsRequest[url]!!.url(formUrlString(url, endpoint)).put(body)
                    "PATCH" -> sessionsRequest[url]!!.url(formUrlString(url, endpoint)).patch(body)
                    // Default to "POST"
                    else -> sessionsRequest[url]!!.url(formUrlString(url, endpoint)).post(body)
                }
            } else {
                sessionsRequest[url]!!.url(formUrlString(url, endpoint)).post(body)
            }

            // Parse options into the request / client
            if (options != null) request = request.parseOptions(options, sessionsClient[url]!!, url)

            // Create a cancellable call
            sessionsCall[taskId] = sessionsClient[url]!!.build().newCall(request.build())

            // Execute the call!
            sessionsCall[taskId]!!.execute().use { response ->
                promise.resolve(response.returnAsWriteableMap(url))
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
