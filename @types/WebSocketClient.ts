// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type WebSocketClientConfiguration = {
    headers?: ClientHeaders;
    timeoutInterval?: number;
    enableCompression?: boolean;
    clientP12Configuration?: ClientP12Configuration;
};

type WebSocketMessage =
    | string
    | WebSocketReadyState
    | Record<string, string | number>;
type WebSocketEvent = {
    url: string;
    message: WebSocketMessage;
};

type WebSocketCallback = (event: WebSocketEvent) => void;

type WebSocketClientErrorEventHandler = (
    event: WebSocketClientErrorEvent
) => void;

interface WebSocketClientInterface {
    url: string;
    readyState: WebSocketReadyState;

    webSocketEventSubscription: EmitterSubscription;
    clientErrorSubscription: EmitterSubscription;
    clientErrorEventHandler?: WebSocketClientErrorEventHandler;
    onClientError(callback: WebSocketClientErrorEventHandler): void;

    send(data: string): void;
    open(): void;
    close(): void;
    onOpen(callback: WebSocketCallback): void;
    onClose(callback: WebSocketCallback): void;
    onError(callback: WebSocketCallback): void;
    onMessage(callback: WebSocketCallback): void;
}

type WebSocketClientErrorEvent = {
    url: string;
    errorCode: number;
    errorDescription: string;
};
