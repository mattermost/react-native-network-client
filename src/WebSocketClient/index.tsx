// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeEventEmitter, NativeModules } from "react-native";
import isURL from "validator/es/lib/isURL";

const {
    WebSocketClient: NativeWebSocketClient,
}: { WebSocketClient: NativeWebSocketClient } = NativeModules;
const Emitter = new NativeEventEmitter(NativeWebSocketClient);
const { EVENTS, READY_STATE } = NativeWebSocketClient.getConstants();

const SOCKETS: { [key: string]: WebSocketClient } = {};

/**
 * Configurable WebSocket client
 */
class WebSocketClient implements WebSocketClientInterface {
    url: string;
    readyState: WebSocketReadyState;

    constructor(url: string) {
        this.url = url;
        this.readyState = READY_STATE.CLOSED;

        Emitter.addListener(
            EVENTS.READY_STATE_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url) {
                    this.readyState = event.message as WebSocketReadyState;
                }
            }
        );
    }

    connect = () => NativeWebSocketClient.connectFor(this.url);
    close = () => NativeWebSocketClient.disconnectFor(this.url);
    send = (data: string) => NativeWebSocketClient.sendDataFor(this.url, data);

    onOpen = (callback: WebSocketCallback) => {
        Emitter.addListener(EVENTS.OPEN_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
                callback(event);
            }
        });
    };

    onClose = (callback: WebSocketCallback) => {
        Emitter.addListener(EVENTS.CLOSE_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
                callback(event);
            }
        });
    };

    onError = (callback: WebSocketCallback) => {
        Emitter.addListener(EVENTS.ERROR_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
                callback(event);
            }
        });
    };

    onMessage = (callback: WebSocketCallback) => {
        Emitter.addListener(EVENTS.MESSAGE_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
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
        throw new Error("baseUrl must be a valid WebSocket URL");
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
