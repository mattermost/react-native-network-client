// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type { EventSubscription } from "react-native";
import type { WebSocketClientConfiguration } from "./WebSocketClient";

enum WebSocketEvents {
    OPEN_EVENT = "WebSocketClient-Open",
    CLOSE_EVENT = "WebSocketClient-Close",
    ERROR_EVENT = "WebSocketClient-Error",
    MESSAGE_EVENT = "WebSocketClient-Message",
    READY_STATE_EVENT = "WebSocketClient-ReadyState",
}

export enum WebSocketReadyState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED,
}

type WebSocketConstants = {
    EVENTS: typeof WebSocketEvents;
    READY_STATE: typeof WebSocketReadyState;
};

export interface NativeWebSocketClient {
    getConstants(): WebSocketConstants;
    createClientFor(
        url: string,
        config?: WebSocketClientConfiguration
    ): Promise<void>;
    connectFor(url: string): Promise<void>;
    disconnectFor(url: string): Promise<void>;
    sendDataFor(url: string, data: string): Promise<void>;
    invalidateClientFor(url: string): Promise<void>;

    addListener(): EventSubscription;
    removeListeners(): void;
}
