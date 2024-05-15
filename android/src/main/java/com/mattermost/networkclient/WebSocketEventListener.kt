package com.mattermost.networkclient

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.EOFException
import org.json.JSONObject
import java.net.ConnectException
import java.net.SocketException
import java.net.URI

class WebSocketEventListener(private val uri: URI) : WebSocketListener() {
    override fun onOpen(webSocket: WebSocket, response: Response) {
        val message = Arguments.createMap()
        message.putMap("headers", response.headers.toWritableMap().copy())
        message.putInt("code", response.code)
        message.putString("message", response.message)

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message.copy())

        sendReadyState(WebSocketReadyState.OPEN)
        sendJSEvent(WebSocketEvents.OPEN_EVENT.event, data)
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
        if (t is EOFException || t is ConnectException || t is SocketException) {
            webSocket.close(1001, "connection terminated")
            onClosed(webSocket, 1001, t.localizedMessage ?: "connection terminated")
            return
        }

        val message = Arguments.createMap()
        message.putString("error", response?.message ?: t.toString())

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message.copy())

        sendJSEvent(WebSocketEvents.ERROR_EVENT.event, data)
    }

    override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
        val message = Arguments.createMap()
        message.putInt("code", code)
        message.putString("reason", reason)

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message.copy())

        sendReadyState(WebSocketReadyState.CLOSING)
        sendJSEvent(WebSocketEvents.CLOSING_EVENT.event, data)
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        val message = Arguments.createMap()
        message.putInt("code", code)
        message.putString("reason", reason)

        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putMap("message", message.copy())

        sendReadyState(WebSocketReadyState.CLOSED)
        sendJSEvent(WebSocketEvents.CLOSE_EVENT.event, data)
    }

    private fun sendJSEvent(eventName: String, data: WritableMap) {
        WebSocketClientModuleImpl.sendJSEvent(eventName, data.copy())
    }

    private fun sendReadyState(readyState: WebSocketReadyState) {
        val data = Arguments.createMap()
        data.putString("url", uri.toString())
        data.putInt("message", readyState.ordinal)

        sendJSEvent(WebSocketEvents.READY_STATE_EVENT.event, data)
    }
}
