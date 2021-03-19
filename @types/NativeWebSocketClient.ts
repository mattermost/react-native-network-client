// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

enum WebSocketEvents {
    OPEN_EVENT = "WebSocketClient-Open",
    CLOSE_EVENT = "WebSocketClient-Close",
    ERROR_EVENT = "WebSocketClient-Error",
    MESSAGE_EVENT = "WebSocketClient-Message",
    READY_STATE_EVENT = "WebSocketClient-ReadyState",
    CLIENT_ERROR = "WebSocketClient-Error",
}

enum WebSocketReadyState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED,
}

type WebSocketConstants = {
    EVENTS: typeof WebSocketEvents;
    READY_STATE: typeof WebSocketReadyState;
};

interface NativeWebSocketClient {
    getConstants(): WebSocketConstants;
    createClientFor(
        url: string,
        config?: WebSocketClientConfiguration
    ): Promise<void>;
    connectFor(url: string): Promise<void>;
    disconnectFor(url: string): Promise<void>;
    sendDataFor(url: string, data: string): Promise<void>;

    addListener(): void;
    removeListeners(): void;
}
