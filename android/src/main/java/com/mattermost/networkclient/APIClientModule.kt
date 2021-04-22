package com.mattermost.networkclient

import com.mattermost.networkclient.enums.APIClientEvents
import com.mattermost.networkclient.enums.RetryTypes
import com.facebook.react.bridge.*
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import android.net.Uri
import android.util.Log
import com.mattermost.networkclient.helpers.ProgressListener
import com.mattermost.networkclient.helpers.UploadFileRequestBody
import java.io.IOException
import java.lang.Exception
import kotlin.collections.HashMap

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val clients = mutableMapOf<HttpUrl, NetworkClient>()
    private val calls = mutableMapOf<String, Call>()

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[url] = NetworkClient(url, options)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun getClientHeadersFor(baseUrl: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        val map = Arguments.createMap()
        val headers = clients[url]!!.clientHeaders
        for((k, v) in headers.toHashMap()){
            map.putString(k, v as String)
        }

        try {
            promise.resolve(map)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun addClientHeadersFor(baseUrl: String, headers: ReadableMap, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[url]!!.addClientHeaders(headers)
            promise.resolve(null);
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients.remove(url);
            promise.resolve(clients.keys);
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun get(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        request("GET", baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun post(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        request("POST", baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun put(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        request("PUT", baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun patch(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        request("PATCH", baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun delete(baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        request("DELETE", baseUrl, endpoint, options, promise)
    }

    @ReactMethod
    fun upload(baseUrl: String, endpoint: String, file: String, taskId: String, options: ReadableMap?, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        val fileUri = Uri.parse(file);
        val skipBytes = options?.getInt("skipBytes")?.toLong() ?: 0
        val fileBody = UploadFileRequestBody(reactApplicationContext, fileUri, skipBytes, ProgressListener(reactApplicationContext, taskId))

        val uploadCall = clients[url]!!.buildUploadCall(endpoint, fileUri, fileBody, options)
        calls[taskId] = uploadCall

        try {
            uploadCall.execute().use { response ->
                promise.resolve(response.returnAsWriteableMap())
            }
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun cancelRequest(taskId: String, promise: Promise) {
        try {
            calls[taskId]!!.cancel()
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()

        val events = HashMap<String, String>()
        APIClientEvents.values().forEach { enum -> events[enum.name] = enum.event }
        constants["EVENTS"] = events

        val retryTypes = HashMap<String, String>()
        RetryTypes.values().forEach { enum -> retryTypes[enum.name] = enum.type }
        constants["RETRY_TYPES"] = retryTypes

        return constants
    }

    private fun request(method: String, baseUrl: String, endpoint: String, options: ReadableMap, promise: Promise) {
        try {
            val url = baseUrl.toHttpUrl()
            val client = clients[url]!!
            client.request(method, endpoint, options).use { response ->
                promise.resolve(response.returnAsWriteableMap())
                client.cleanUpAfter(response)
            }
        } catch (error: Exception) {
            return promise.reject(error)
        }
    }
}
