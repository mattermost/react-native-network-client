package com.mattermost.networkclient.events

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mattermost.networkclient.enums.WebSocketEvents
import com.mattermost.networkclient.enums.WebSocketReadyState
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class WebSocketEvent(private var reactContext: ReactContext, private var url: String) : WebSocketListener() {

    override fun onOpen(webSocket: WebSocket, response: Response) {
        val data = Arguments.createMap();
        data.putString("url", url)
        data.putString("message", response.message);
        emitEvent(WebSocketEvents.OPEN_EVENT, data)
        sendReadyState(WebSocketReadyState.OPEN)
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
        val data = Arguments.createMap();
        data.putString("url", url)
        data.putString("message", text);
        emitEvent(WebSocketEvents.MESSAGE_EVENT, data)
    }

    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
        val data = Arguments.createMap();
        data.putString("url", url)
        data.putString("message", response?.message);
        emitEvent(WebSocketEvents.ERROR_EVENT, data)
    }

    override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
        val data = Arguments.createMap();
        data.putString("url", url)
        data.putString("message", reason);
        emitEvent(WebSocketEvents.CLOSING_EVENT, data)
        sendReadyState(WebSocketReadyState.CLOSING)
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        val data = Arguments.createMap();
        data.putString("url", url)
        data.putString("message", reason);
        emitEvent(WebSocketEvents.CLOSE_EVENT, data)
        sendReadyState(WebSocketReadyState.CLOSED)
    }

    private fun sendReadyState(readyState: WebSocketReadyState) {
        val data = Arguments.createMap();
        data.putString("url", url)
        data.putInt("readyState", readyState.ordinal)
        emitEvent(WebSocketEvents.READY_STATE_EVENT, data)
    }

    private fun emitEvent(name: WebSocketEvents, data: WritableMap?) {
        reactContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(name.event, data)
    }
}
