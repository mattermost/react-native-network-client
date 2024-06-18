package com.mattermost.networkclient.enums

enum class WebSocketEvents(val event: String) {
    OPEN_EVENT("WebSocketClient-Open"),
    CLOSING_EVENT("WebSocketClient-Closing"),
    CLOSE_EVENT("WebSocketClient-Close"),
    ERROR_EVENT("WebSocketClient-Error"),
    MESSAGE_EVENT("WebSocketClient-Message"),
    READY_STATE_EVENT("WebSocketClient-ReadyState")
}
