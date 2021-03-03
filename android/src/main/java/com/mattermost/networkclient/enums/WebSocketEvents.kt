package com.mattermost.networkclient.enums

enum class WebSocketEvents(val event: String) {
    OPEN_EVENT("NetworkClient-WebSocket-Open"),
    CLOSING_EVENT("NetworkClient-WebSocket-Closing"),
    CLOSE_EVENT("NetworkClient-WebSocket-Close"),
    ERROR_EVENT("NetworkClient-WebSocket-Error"),
    MESSAGE_EVENT("NetworkClient-WebSocket-Message"),
    READY_STATE_EVENT("NetworkClient-WebSocket-ReadyState")
}
