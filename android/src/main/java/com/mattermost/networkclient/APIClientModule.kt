package com.mattermost.networkclient

import com.mattermost.networkclient.enums.APIClientEvents
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.helpers.ProgressListener
import com.mattermost.networkclient.helpers.UploadFileRequestBody
import com.mattermost.networkclient.helpers.KeyStoreHelper
import com.facebook.react.bridge.*
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.ReactCookieJarContainer
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import android.content.SharedPreferences
import android.content.Context
import android.net.Uri
import java.lang.Exception
import kotlin.collections.HashMap

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "APIClient"
    }

    companion object {
        private val clients = mutableMapOf<HttpUrl, NetworkClient>()
        private val calls = mutableMapOf<String, Call>()
        private lateinit var sharedPreferences: SharedPreferences
        private const val SHARED_PREFERENCES_NAME = "APIClientPreferences"
        val cookieJar = ReactCookieJarContainer()

        fun getClientForRequest(request: Request): NetworkClient? {
            var urlParts = request.url.toString().split("/")
            while (urlParts.isNotEmpty()) {
                val url = urlParts.joinToString (separator = "/") { it }.toHttpUrlOrNull()
                if (url !== null && clients.containsKey(url)) {
                    return clients[url]!!
                }

                urlParts = urlParts.dropLast(1)
            }

            return null
        }

        fun storeToken(value: String, baseUrl: String) {
            val encryptedValue = KeyStoreHelper.encryptData(value)
            sharedPreferences.edit()
                .putString(baseUrl, encryptedValue)
                .apply()
        }

        fun retrieveToken(baseUrl: String): String? {
            val encryptedData = sharedPreferences.getString(baseUrl, null)
            if (encryptedData != null) {
                return KeyStoreHelper.decryptData(encryptedData)
            }

            return null
        }

        fun deleteToken(baseUrl: String) {
            sharedPreferences.edit()
                    .remove(baseUrl)
                    .apply()
        }

        private fun setSharedPreferences(reactContext: ReactApplicationContext) {
            sharedPreferences = reactContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
        }

        private fun setCookieJar(reactContext: ReactApplicationContext) {
            val cookieHandler = ForwardingCookieHandler(reactContext);
            cookieJar.setCookieJar(JavaNetCookieJar(cookieHandler))
        }
    }

    init {
        setSharedPreferences(reactContext)
        setCookieJar(reactContext)
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
            clients[url] = NetworkClient(url, options, cookieJar)
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
    fun importClientP12For(baseUrl: String, path: String, password: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[url]!!.importClientP12(path, password)
            promise.resolve(null)
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
            clients[url]!!.invalidate()
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
