package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import kotlin.collections.HashMap

class WebSocketClientModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val clients = mutableMapOf<HttpUrl, NetworkClient>()

    override fun getName(): String {
        return "WebSocketClient"
    }

    @ReactMethod
    fun createClientFor(baseUrl: String, options: ReadableMap, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }


        try {
            clients[url] = NetworkClient(url, options)

            promise.resolve(null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun invalidateClientFor(baseUrl: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }


        clients[url]!!.webSocket?.close(1000, null)
        clients.remove(url);

        promise.resolve(null)
    }

    @ReactMethod
    fun connectFor(baseUrl: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }


        val listener = WebSocketEventListener(reactContext, url)
        try {
            clients[url]!!.createWebSocket(listener)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun disconnectFor(baseUrl: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }


        try {
            clients[url]!!.webSocket!!.close(1000, null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun sendDataFor(baseUrl: String, data: String, promise: Promise) {
        var url: HttpUrl
        try {
            url = baseUrl.toHttpUrl()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }


        try {
            clients[url]!!.webSocket!!.send(data)
        } catch (err: Throwable) {
            promise.reject(err)
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
