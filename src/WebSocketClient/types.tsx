// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export interface WebSocketClientInterface {
    wsUrl: string;
    disconnect(): void;
}

export type WebSocketCallbacks = {
    onConnect(): void;
    onDisconnect(): void;
    onEvent(event: string, data: any): void;
}

type iOSWebSocketClientConfiguration = {};
type AndroidWebSocketClientConfiguration = {};
export type WebSocketClientConfiguration = iOSWebSocketClientConfiguration | AndroidWebSocketClientConfiguration;
