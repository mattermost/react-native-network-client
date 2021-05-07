package com.mattermost.networkclient

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.ReactCookieJarContainer
import com.mattermost.networkclient.enums.APIClientEvents
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.helpers.KeyStoreHelper
import okhttp3.Call
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.JavaNetCookieJar
import okhttp3.Request

class APIClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "APIClient"
    }

    companion object {
        lateinit var context: ReactApplicationContext
        private val clients = mutableMapOf<HttpUrl, NetworkClient>()
        private val calls = mutableMapOf<String, Call>()
        private lateinit var sharedPreferences: SharedPreferences
        private const val SHARED_PREFERENCES_NAME = "APIClientPreferences"
        val cookieJar = ReactCookieJarContainer()

        fun getClientForRequest(request: Request): NetworkClient? {
            var urlParts = request.url.toString().split("/")
            while (urlParts.isNotEmpty()) {
                val url = urlParts.joinToString(separator = "/") { it }.toHttpUrlOrNull()
                if (url !== null && clients.containsKey(url)) {
                    return clients[url]!!
                }

                urlParts = urlParts.dropLast(1)
            }

            return null
        }

        fun storeValue(value: String, alias: String) {
            val encryptedValue = KeyStoreHelper.encryptData(value)
            sharedPreferences.edit()
                .putString(alias, encryptedValue)
                .apply()
        }

        fun retrieveValue(alias: String): String? {
            val encryptedData = sharedPreferences.getString(alias, null)
            if (encryptedData != null) {
                return KeyStoreHelper.decryptData(encryptedData)
            }

            return null
        }

        fun deleteValue(alias: String) {
            sharedPreferences.edit()
                    .remove(alias)
                    .apply()
        }

        fun sendJSEvent(eventName: String, data: WritableMap?) {
            context.getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit(eventName, data)
        }

        private fun setCtx(reactContext: ReactApplicationContext) {
            context = reactContext
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
        setCtx(reactContext)
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

        try {
            promise.resolve(clients[url]!!.clientHeaders)
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
            clients[url]!!.importClientP12AndRebuildClient(path, password)
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
    fun upload(baseUrl: String, endpoint: String, filePath: String, taskId: String, options: ReadableMap?, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        val uploadCall = clients[url]!!.buildUploadCall(endpoint, filePath, taskId, options)
        calls[taskId] = uploadCall

        try {
            uploadCall.execute().use { response ->
                promise.resolve(response.toWritableMap())
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
                promise.resolve(response.toWritableMap())
                client.cleanUpAfter(response)
            }
        } catch (error: Exception) {
            return promise.reject(error)
        }
    }
}
