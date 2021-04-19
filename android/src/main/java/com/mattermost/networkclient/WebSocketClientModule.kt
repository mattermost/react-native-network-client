package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import com.mattermost.networkclient.events.WebSocketEvent
import com.mattermost.networkclient.helpers.applyClientOptions
import com.mattermost.networkclient.helpers.trimSlashes
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import kotlin.collections.HashMap

class WebSocketClientModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val clients = SessionsObject.client
    private val configs = SessionsObject.requestConfig
    private val sockets = SessionsObject.socket

    override fun getName(): String {
        return "WebSocketClient"
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
            clients[url] = OkHttpClient().newBuilder()
            configs[url] = hashMapOf("baseUrl" to url);

            // Attach client options if they are passed in
            clients[url]!!.applyClientOptions(options, url);

            // Return client for success
            promise.resolve(null)
        } catch (err: Throwable) {
            promise.reject(err)
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

        // Close the connection
        sockets[url]?.close(1000, null)

        // Remove
        sockets.remove(url);
        clients.remove(url);

        promise.resolve(null)
    }

    @ReactMethod
    fun connectFor(baseUrl: String, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            sockets[url] = clients[url]!!.build().newWebSocket(Request.Builder().build(), WebSocketEvent(reactContext, url))
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun disconnectFor(baseUrl: String, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            sockets[url]!!.close(1000, null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun sendDataFor(baseUrl: String, data: String, promise: Promise) {
        var url: String
        try {
            url = baseUrl.toHttpUrl().toString()
        } catch (err: IllegalArgumentException) {
            return promise.reject(err)
        }

        try {
            sockets[url]!!.send(data)
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
