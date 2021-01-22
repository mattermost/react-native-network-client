// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import type { NativeModule } from "react-native";

declare global {
    enum WebSocketEvents {
        OPEN_EVENT = "NetworkClient-WebSocket-Open",
        CLOSE_EVENT = "NetworkClient-WebSocket-Close",
        ERROR_EVENT = "NetworkClient-WebSocket-Error",
        MESSAGE_EVENT = "NetworkClient-WebSocket-Message",
        READY_STATE_EVENT = "NetworkClient-WebSocket-ReadyState",
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

    interface NativeWebSocketClient extends NativeModule {
        getConstants(): WebSocketConstants;
        createClientFor(
            url: string,
            config?: WebSocketClientConfiguration
        ): Promise<void>;
        connectFor(url: string): Promise<void>;
        disconnectFor(url: string): Promise<void>;
        sendDataFor(url: string, data: string): Promise<void>;
    }
}
