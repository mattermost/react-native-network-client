package com.mattermost.networkclient.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class WebSocketEvent(private var reactContext: ReactContext, private var url: String) : WebSocketListener() {

    override fun onOpen(webSocket: WebSocket, response: Response) {
        emitEvent("NetworkClient-WebSocket-Open")
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
        val event = Arguments.createMap();
        event.putString("NetworkClient-WebSocket-Message", text)
        emitEvent(event)
    }

    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
        val event = Arguments.createMap();
        event.putString("NetworkClient-WebSocket-Error", t.message)
        emitEvent(event)
    }

    override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
        emitEvent("NetworkClient-WebSocket-Closing")
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        emitEvent("NetworkClient-WebSocket-Close")
    }

    private fun emitEvent(params: Any) {
        reactContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(url, params)
    }
}
