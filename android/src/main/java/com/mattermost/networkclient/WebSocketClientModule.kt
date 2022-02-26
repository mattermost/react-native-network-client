package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import java.net.URI
import kotlin.collections.HashMap

internal class WebSocketClientModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val clients = mutableMapOf<URI, NetworkClient>()

    override fun getName(): String {
        return "WebSocketClient"
    }

    companion object {
        lateinit var context: ReactApplicationContext

        fun sendJSEvent(eventName: String, data: ReadableMap?) {
            if (context.hasActiveCatalystInstance()) {
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit(eventName, data)
            }
        }

        private fun setCtx(reactContext: ReactApplicationContext) {
            context = reactContext
        }
    }

    init {
        setCtx(reactContext)
    }

    override fun invalidate() {
        super.invalidate()
        clients.forEach {(_, value) ->
            value.webSocket?.close(1000, null)
        }
    }

    @ReactMethod
    fun createClientFor(wsUrl: String, options: ReadableMap, promise: Promise) {
        var wsUri: URI
        var baseUrl: HttpUrl
        try {
            wsUri = URI(wsUrl)
            baseUrl = httpUrlFromURI(wsUri)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }

        try {
            clients[wsUri] = NetworkClient(wsUri, baseUrl, options)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject(error)
        }
    }

    @ReactMethod
    fun invalidateClientFor(wsUrl: String, promise: Promise) {
        var wsUri: URI
        try {
            wsUri = URI(wsUrl)
        } catch (error: IllegalArgumentException) {
            return promise.reject(error)
        }


        clients[wsUri]!!.webSocket?.close(1000, null)
        clients.remove(wsUri);

        promise.resolve(null)
    }

    @ReactMethod
    fun connectFor(wsUrl: String, promise: Promise) {
        var wsUri: URI
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

    @ReactMethod
    fun disconnectFor(wsUrl: String, promise: Promise) {
        var wsUri: URI
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

    @ReactMethod
    fun sendDataFor(wsUrl: String, data: String, promise: Promise) {
        var wsUri: URI
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

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built in Event Emitter Calls
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls
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
