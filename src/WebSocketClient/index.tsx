// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeEventEmitter, NativeModules } from "react-native";
import isURL from "validator/es/lib/isURL";

const { WebSocketClient: NativeWebSocketClient } = NativeModules;
const CONSTANTS = NativeWebSocketClient.getConstants();
const Emitter = new NativeEventEmitter(NativeWebSocketClient);

const SOCKETS: { [key: string]: WebSocketClient } = {};

/**
 * Configurable WebSocket client
 */
class WebSocketClient implements WebSocketClientInterface {
    url: string;
    sequence: number;
    connected: boolean;
    // readyState: number;

    constructor(url: string) {
        this.url = url;
        this.sequence = 1;
        this.connected = false;

        // Emitter.addListener(
        //     CONSTANTS.READY_STATE_CHANGE,
        //     (event: WebSocketEvent) => {
        //         if (event.url === this.url) {
        //             this.readyState = event.message;
        //         }
        //     }
        // );
    }

    connect = () => {
        console.log("CONNECT");
        NativeWebSocketClient.connectFor(this.url);
    };
    send = (data: WebSocketMessage) => {
        console.log("JS SEND", data);
        NativeWebSocketClient.sendDataFor(this.url, data);
    };
    close = () => {
        NativeWebSocketClient.disconnectFor(this.url);
    };

    onOpen = (callback: WebSocketCallback) => {
        Emitter.addListener(CONSTANTS.OPEN_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
                callback(event);
            }
        });
    };

    onClose = (callback: WebSocketCallback) => {
        Emitter.addListener(CONSTANTS.CLOSE_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
                callback(event);
            }
        });
    };

    onError = (callback: WebSocketCallback) => {
        Emitter.addListener(CONSTANTS.ERROR_EVENT, (event: WebSocketEvent) => {
            if (event.url === this.url && callback) {
                callback(event);
            }
        });
    };

    onMessage = (callback: WebSocketCallback) => {
        Emitter.addListener(
            CONSTANTS.MESSAGE_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url && callback) {
                    callback(event);
                }
            }
        );
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
        try {
            await NativeWebSocketClient.createClientFor(url, config);
            SOCKETS[url] = websocket;
        } catch (error) {
            console.log("NATIVE WS CREATION FAILED", error);
        }
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
