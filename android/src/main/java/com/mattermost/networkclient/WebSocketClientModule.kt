package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import java.net.URI
import kotlin.collections.HashMap

class WebSocketClientModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val clients = mutableMapOf<URI, NetworkClient>()

    override fun getName(): String {
        return "WebSocketClient"
    }

    companion object {
        lateinit var context: ReactApplicationContext

        fun sendJSEvent(eventName: String, data: WritableMap?) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, data)
        }

        private fun setCtx(reactContext: ReactApplicationContext) {
            context = reactContext
        }
    }

    init {
        setCtx(reactContext)
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        var uri: URI
        try {
            uri = URI(baseUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        val httpScheme = if (uri.scheme == "wss") "https" else "http"
        val httpUri = URI(httpScheme, uri.authority, uri.path, uri.query, uri.fragment)
        var httpUrl: HttpUrl
        try {
            httpUrl = httpUri.toString().toHttpUrl()
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[uri] = NetworkClient(httpUrl, options)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        var uri: URI
        try {
            uri = URI(baseUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }


        clients[uri]!!.webSocket?.close(1000, null)
        clients.remove(uri);

        promise.resolve(null)
    }

    @ReactMethod
    fun connectFor(baseUrl: String, promise: Promise) {
        var uri: URI
        try {
            uri = URI(baseUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[uri]!!.createWebSocket(uri)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun disconnectFor(baseUrl: String, promise: Promise) {
        var uri: URI
        try {
            uri = URI(baseUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[uri]!!.webSocket!!.close(1000, null)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun sendDataFor(baseUrl: String, data: String, promise: Promise) {
        var uri: URI
        try {
            uri = URI(baseUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }


        try {
            clients[uri]!!.webSocket!!.send(data)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()

        val events = HashMap<String, String>()
        WebSocketEvents.values().forEach { enum -> events[enum.name] = enum.event }

        val readyState = HashMap<String, Int>()
        WebSocketReadyState.values().forEach { enum -> readyState[enum.name] = enum.ordinal }

        constants["READY_STATE"] = readyState
        constants["EVENTS"] = events

        return constants
    }

}
