// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

interface WebSocketClientInterface {
    wsUrl: string;
    disconnect(): void;
}

type WebSocketCallbacks = {
    onConnect(): void;
    onDisconnect(): void;
    onEvent(event: string, data: Record<string, string>): void;
}

type iOSWebSocketClientConfiguration = Record<string, string>;
type AndroidWebSocketClientConfiguration = Record<string, string>;
type WebSocketClientConfiguration = iOSWebSocketClientConfiguration | AndroidWebSocketClientConfiguration;
