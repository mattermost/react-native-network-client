// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeEventEmitter, NativeModules } from "react-native";
import isURL from "validator/es/lib/isURL";

import type {
    WebSocketClientConfiguration,
    WebSocketClientErrorEvent,
    WebSocketClientErrorEventHandler,
    WebSocketClientInterface,
    WebSocketEvent,
    WebSocketEventHandler,
    WebSocketReadyState,
} from "@mattermost/react-native-network-client";

const { WebSocketClient: NativeWebSocketClient } = NativeModules;
const Emitter = new NativeEventEmitter(NativeWebSocketClient);
const { EVENTS, READY_STATE } = NativeWebSocketClient.getConstants();

const CLIENTS: { [key: string]: WebSocketClient } = {};

/**
 * Configurable WebSocket client
 */
class WebSocketClient implements WebSocketClientInterface {
    url: string;
    readyState: WebSocketReadyState;
    onReadyStateSubscription: EmitterSubscription;
    onWebSocketOpenSubscription?: EmitterSubscription;
    onWebSocketCloseSubscription?: EmitterSubscription;
    onWebSocketErrorSubscription?: EmitterSubscription;
    onWebSocketMessageSubscription?: EmitterSubscription;
    onWebSocketClientErrorSubscription?: EmitterSubscription;

    constructor(url: string) {
        this.url = url;
        this.readyState = READY_STATE.CLOSED;
        this.onReadyStateSubscription = Emitter.addListener(
            EVENTS.READY_STATE_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url) {
                    this.readyState = event.message as WebSocketReadyState;
                }
            }
        );
    }

    open = () => NativeWebSocketClient.connectFor(this.url);
    close = () => NativeWebSocketClient.disconnectFor(this.url);
    send = (data: string) => NativeWebSocketClient.sendDataFor(this.url, data);

    onOpen = (callback: WebSocketEventHandler) => {
        if (this.onWebSocketOpenSubscription) {
            this.onWebSocketOpenSubscription.remove();
        }

        this.onWebSocketOpenSubscription = Emitter.addListener(
            EVENTS.OPEN_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url && callback) {
                    callback(event);
                }
            }
        );
    };

    onClose = (callback: WebSocketEventHandler) => {
        if (this.onWebSocketCloseSubscription) {
            this.onWebSocketCloseSubscription.remove();
        }

        this.onWebSocketCloseSubscription = Emitter.addListener(
            EVENTS.CLOSE_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url && callback) {
                    callback(event);
                }
            }
        );
    };

    onError = (callback: WebSocketEventHandler) => {
        if (this.onWebSocketErrorSubscription) {
            this.onWebSocketErrorSubscription.remove();
        }

        this.onWebSocketErrorSubscription = Emitter.addListener(
            EVENTS.ERROR_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url && callback) {
                    callback(event);
                }
            }
        );
    };

    onMessage = (callback: WebSocketEventHandler) => {
        if (this.onWebSocketMessageSubscription) {
            this.onWebSocketMessageSubscription.remove();
        }

        this.onWebSocketMessageSubscription = Emitter.addListener(
            EVENTS.MESSAGE_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url && callback) {
                    callback(event);
                }
            }
        );
    };

    onClientError = (callback: WebSocketClientErrorEventHandler) => {
        if (this.onWebSocketClientErrorSubscription) {
            this.onWebSocketClientErrorSubscription.remove();
        }
        this.onWebSocketClientErrorSubscription = Emitter.addListener(
            EVENTS.CLIENT_ERROR,
            (event: WebSocketClientErrorEvent) => {
                if (event.url === this.url) {
                    callback(event);
                }
            }
        );
    };

    invalidate = (): Promise<void> => {
        this.onReadyStateSubscription.remove();
        this.onWebSocketOpenSubscription?.remove();
        this.onWebSocketCloseSubscription?.remove();
        this.onWebSocketErrorSubscription?.remove();
        this.onWebSocketMessageSubscription?.remove();
        this.onWebSocketClientErrorSubscription?.remove();

        delete CLIENTS[this.url];

        return NativeWebSocketClient.invalidateClientFor(this.url);
    };
}

async function getOrCreateWebSocketClient(
    url: string,
    config: WebSocketClientConfiguration = {},
    clientErrorEventHandler?: WebSocketClientErrorEventHandler
): Promise<{ client: WebSocketClient; created: boolean }> {
    if (!isValidWebSocketURL(url)) {
        throw new Error(`"${url}" is not a valid WebSocket URL`);
    }

    let created = false;
    let client = CLIENTS[url];
    if (!client) {
        created = true;
        client = new WebSocketClient(url);
        if (clientErrorEventHandler) {
            client.onClientError(clientErrorEventHandler);
        }
        await NativeWebSocketClient.createClientFor(url, config);
        CLIENTS[url] = client;
    }

    return { client, created };
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
