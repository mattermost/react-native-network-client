package com.mattermost.networkclient

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import java.net.URI

class WebSocketClientModuleImpl(reactApplicationContext: ReactApplicationContext) {
    private val clients = mutableMapOf<URI, NetworkClient>()

    companion object {
        const val NAME = "WebSocketClient"

        private lateinit var context: ReactApplicationContext

        fun sendJSEvent(eventName: String, data: ReadableMap?) {
            if (context.hasActiveReactInstance()) {
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                        .emit(eventName, data)
            }
        }

        private fun setCtx(reactContext: ReactApplicationContext) {
            context = reactContext
        }
    }

    init {
        setCtx(reactApplicationContext)
    }

    fun invalidate() {
        clients.forEach {(_, value) ->
            value.webSocket?.close(1000, null)
        }
    }

    fun ensureClientFor(wsUrl: String, options: ReadableMap, promise: Promise) {
        val wsUri: URI
        try {
            wsUri = URI(wsUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        if (clients.containsKey(wsUri)) {
            clients[wsUri]!!.webSocket?.close(1000, null)
            clients.remove(wsUri)
        }

        createClientFor(wsUrl, options, promise)
    }

    fun createClientFor(wsUrl: String, options: ReadableMap, promise: Promise) {
        val wsUri: URI
        val baseUrl: HttpUrl
        try {
            wsUri = URI(wsUrl)
            baseUrl = httpUrlFromURI(wsUri)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        if (clients.containsKey(wsUri)) {
            return promise.reject("WebSocket error", "already existing client for this websocket url")
        }

        try {
            clients[wsUri] = NetworkClient(context, wsUri, baseUrl, options)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    fun invalidateClientFor(wsUrl: String, promise: Promise) {
        val wsUri: URI
        try {
            wsUri = URI(wsUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }


        clients[wsUri]!!.webSocket?.close(1000, null)
        clients.remove(wsUri)

        promise.resolve(null)
    }

    fun connectFor(wsUrl: String, promise: Promise) {
        val wsUri: URI
        try {
            wsUri = URI(wsUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[wsUri]!!.createWebSocket()
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    fun disconnectFor(wsUrl: String, promise: Promise) {
        val wsUri: URI
        try {
            wsUri = URI(wsUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[wsUri]!!.webSocket!!.close(1000, "manual")
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    fun sendDataFor(wsUrl: String, data: String, promise: Promise) {
        val wsUri: URI
        try {
            wsUri = URI(wsUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }


        try {
            clients[wsUri]!!.webSocket!!.send(data)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    /**
     * Creates an HttpUrl from a URI by replacing the scheme with `http` or `https`
     *
     * @throws Exception from toHttpUrl which we leave to the caller of this function to handle.
     */
    private fun httpUrlFromURI(uri: URI): HttpUrl {
        val httpScheme = if (uri.scheme == "wss") "https" else "http"
        val httpUri = URI(httpScheme, uri.authority, uri.path, uri.query, uri.fragment)

        return httpUri.toString().toHttpUrl()
    }
}
