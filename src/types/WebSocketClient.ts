// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type { ClientHeaders, ClientP12Configuration } from "./APIClient";
import type { WebSocketReadyState } from "./NativeWebSocketClient";

export type WebSocketClientConfiguration = {
    headers?: ClientHeaders;
    timeoutInterval?: number;
    enableCompression?: boolean;
    clientP12Configuration?: ClientP12Configuration;
    trustSelfSignedServerCertificate?: boolean;
};

type WebSocketMessage =
    | string
    | WebSocketReadyState
    | Record<string, string | number>;

export type WebSocketEvent = {
    url: string;
    message: WebSocketMessage;
};

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

export type WebSocketClientErrorEventHandler = (
    event: WebSocketClientErrorEvent
) => void;

export interface WebSocketClientInterface {
    url: string;
    readyState: WebSocketReadyState;

    onReadyStateSubscription: EmitterSubscription;
    onWebSocketOpenSubscription?: EmitterSubscription;
    onWebSocketCloseSubscription?: EmitterSubscription;
    onWebSocketErrorSubscription?: EmitterSubscription;
    onWebSocketMessageSubscription?: EmitterSubscription;
    onWebSocketClientErrorSubscription?: EmitterSubscription;

    send(data: string): void;
    open(): void;
    close(): void;
    onOpen(callback: WebSocketEventHandler): void;
    onClose(callback: WebSocketEventHandler): void;
    onError(callback: WebSocketEventHandler): void;
    onMessage(callback: WebSocketEventHandler): void;
    onClientError(callback: WebSocketClientErrorEventHandler): void;
    invalidate(): Promise<void>;
}

export type WebSocketClientErrorEvent = {
    url: string;
    errorCode: number;
    errorDescription: string;
};
