package com.mattermost.networkclient

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.net.URI

class WebSocketEventListener(private val uri: URI) : WebSocketListener() {
    override fun onOpen(webSocket: WebSocket, response: Response) {
        val message = Arguments.createMap()
        message.putMap("headers", response.headers.toWritableMap())
        message.putInt("code", response.code)
        message.putString("message", response.message)

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message)

        sendJSEvent(WebSocketEvents.OPEN_EVENT.event, data)
        sendReadyState(WebSocketReadyState.OPEN)
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        try {
            val message = JSONObject(text).toWritableMap()
            data.putMap("message", message)
        } catch (_: Exception) {
            data.putString("message", text)
        }

        sendJSEvent(WebSocketEvents.MESSAGE_EVENT.event, data)
    }

    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
        val message = Arguments.createMap()
        message.putString("error", response?.message ?: t.toString())

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message)

        sendJSEvent(WebSocketEvents.ERROR_EVENT.event, data)
    }

    override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
        val message = Arguments.createMap()
        message.putInt("code", code)
        message.putString("reason", reason)

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message)

        sendJSEvent(WebSocketEvents.CLOSING_EVENT.event, data)
        sendReadyState(WebSocketReadyState.CLOSING)
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        val message = Arguments.createMap()
        message.putInt("code", code)
        message.putString("reason", reason)

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message)

        sendJSEvent(WebSocketEvents.CLOSE_EVENT.event, data)
        sendReadyState(WebSocketReadyState.CLOSED)
    }

    private fun sendJSEvent(eventName: String, data: WritableMap) {
        WebSocketClientModule.sendJSEvent(eventName, data)
    }

    private fun sendReadyState(readyState: WebSocketReadyState) {
        val data = Arguments.createMap();
        data.putString("url", uri.toString())
        data.putInt("readyState", readyState.ordinal)

        sendJSEvent(WebSocketEvents.READY_STATE_EVENT.event, data)
    }
}
