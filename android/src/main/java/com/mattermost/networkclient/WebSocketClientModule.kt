package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.events.WebSocketEvent
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import kotlin.collections.HashMap

class WebSocketClientModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    var clients = mutableMapOf<String, OkHttpClient.Builder>()
    var sockets = mutableMapOf<String, WebSocket>()
    var requests = mutableMapOf<String, Request.Builder>()

    override fun getName(): String {
        return "APIClient"
    }

    @ReactMethod
    fun createClientFor(url: String, options: ReadableMap, promise: Promise) {
        try {
            // Create the client and request builder
            clients[url] = OkHttpClient().newBuilder();
            requests[url] = Request.Builder().url(url);

            // Attach client options if they are passed in
            clients[url]!!.parseOptions(options);

            // Return stringified client for success
            promise.resolve(null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun connectFor(url: String, promise: Promise) {
        try {
            sockets[url] = clients[url]!!.build().newWebSocket(requests[url]!!.build(), WebSocketEvent(reactContext, url))
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun disconnectFor(url: String, promise: Promise) {
        try {
            sockets[url]!!.close(0, null)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @ReactMethod
    fun sendDataFor(url: String, data: String, promise: Promise) {
        try {
            sockets[url]!!.send(data)
        } catch (err: Throwable) {
            promise.reject(err)
        }
    }

    @Override
    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()
        constants["EVENTS"] = HashMap<String, String>()
        constants["READY_STATE"] = HashMap<String, String>()
        return constants
    }
}
