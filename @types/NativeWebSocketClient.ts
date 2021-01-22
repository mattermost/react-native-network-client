// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

enum WebSocketConstants {
    OPEN_EVENT = "NativeClient-WebSocket-Open",
    CLOSE_EVENT = "NativeClient-WebSocket-Close",
    ERROR_EVENT = "NativeClient-WebSocket-Error",
    MESSAGE_EVENT = "NativeClient-WebSocket-Message",
}

interface NativeWebSocketClient {
    getConstants(): WebSocketConstants;
    createClientFor(
        url: string,
        config?: WebSocketClientConfiguration
    ): Promise<void>;
    connectFor(url: string): Promise<void>;
    disconnectFor(url: string): Promise<void>;
    sendDataFor(url: string, event: WebSocketEvent): Promise<void>;
}
