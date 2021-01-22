// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeEventEmitter, NativeModules } from "react-native";
import isURL from "validator/es/lib/isURL";

const {
    WebSocketClient: NativeWebSocketClient,
}: { WebSocketClient: NativeWebSocketClient } = NativeModules;
const Emitter = new NativeEventEmitter(NativeWebSocketClient);
const EVENTS = NativeWebSocketClient.getConstants();

enum ReadyState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED,
}

const SOCKETS: { [key: string]: WebSocketClient } = {};

/**
 * Configurable WebSocket client
 */
class WebSocketClient implements WebSocketClientInterface {
    url: string;
    readyState: ReadyState;
    onOpenCallback?: WebSocketCallback;
    onCloseCallback?: WebSocketCallback;

    constructor(url: string) {
        this.url = url;
        this.readyState = ReadyState.CLOSED;

        Emitter.addListener(EVENTS.OPEN_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url) {
                this.readyState = ReadyState.OPEN;
                if (this.onOpenCallback) {
                    this.onOpenCallback(event);
                }
            }
        });

        Emitter.addListener(EVENTS.CLOSE_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url) {
                this.readyState = ReadyState.CLOSED;
                if (this.onCloseCallback) {
                    this.onCloseCallback(event);
                }
            }
        });
    }

    connect = () => NativeWebSocketClient.connectFor(this.url);
    close = () => NativeWebSocketClient.disconnectFor(this.url);
    send = (data: string) => NativeWebSocketClient.sendDataFor(this.url, data);

    onOpen = (callback: WebSocketCallback) => {
        this.onOpenCallback = callback;
    };

    onClose = (callback: WebSocketCallback) => {
        this.onCloseCallback = callback;
    };

    onError = (callback: WebSocketCallback) => {
        Emitter.addListener(EVENTS.ERROR_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url) {
                callback(event);
            }
        });
    };

    onMessage = (callback: WebSocketCallback) => {
        Emitter.addListener(EVENTS.MESSAGE_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url) {
                callback(event);
            }
        });
    };
}

async function getOrCreateWebSocketClient(
    url: string,
    config: WebSocketClientConfiguration = {}
): Promise<{ client: WebSocketClient; created: boolean }> {
    if (!isValidWebSocketURL(url)) {
        throw new Error("url must be a valid WebSocket URL");
    }

    let created = false;
    let websocket = SOCKETS[url];
    if (!websocket) {
        created = true;
        websocket = new WebSocketClient(url);
        await NativeWebSocketClient.createClientFor(url, config);
        SOCKETS[url] = websocket;
    }

    return { client: websocket, created };
}

const isValidWebSocketURL = (url: string) => {
    return isURL(url, {
        protocols: ["ws", "wss"],
        require_protocol: true,
        require_valid_protocol: true,
        require_host: true,
    });
};

export { getOrCreateWebSocketClient };
