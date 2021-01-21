package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.uploads.ProgressListener
import com.mattermost.networkclient.uploads.UploadFileRequestBody
import okhttp3.Call
import okhttp3.MultipartBody

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okio.IOException
import java.util.*
import java.io.File


class APIClientModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

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
            sessionsClient[baseUrl]!!.parseOptions(options);

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
            sessionsRequest[baseUrl]?.addReadableMap(headers)
            promise.resolve(null);
        } catch (error: Error) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        try {
            sessionsRequest.remove(baseUrl);
            promise.resolve(sessionsRequest.keys);
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").post(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").put(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").patch(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
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
            val body = options.getMap("body").toString().toRequestBody();
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").delete(body).parseOptions(options, sessionsClient[baseUrl]!!).build();
            sessionsClient[baseUrl]!!.build().newCall(request).execute().use { response ->
                response.promiseResolution(promise)
            }
        } catch (e: IOException) {
            promise.reject(e)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()
        constants["EXPONENTIAL_RETRY"] = "EXPONENTIAL_RETRY"
        return constants
    }

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String?, fileUrl: String, taskId: String, options: ReadableMap, promise: Promise) {

        // Set skipBytes if it's passed in
        val skipBytes = if (options.hasKey("skipBytes")) options.getInt("skipBytes").toLong() else null;

        try {
            // Create the file from URL
            val file = File(fileUrl);

            // Create a Multi-part form for uploading the file
            val body = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    // Pass in the Custom File Body, with the Progress Listener Event
                    .addPart(UploadFileRequestBody(file, ProgressListener(reactContext, taskId), skipBytes))
                    .build()

            // Parse any other request options
            val request = sessionsRequest[baseUrl]!!.url("$baseUrl/$endpoint").post(body).parseOptions(options, sessionsClient[baseUrl]!!).build();

            // Cancellable, so create the call first
            calls[taskId] = sessionsClient[baseUrl]!!.build().newCall(request)

            // Run the call
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
}
