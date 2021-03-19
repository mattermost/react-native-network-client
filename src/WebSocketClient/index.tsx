// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { Alert, NativeEventEmitter, NativeModules } from "react-native";
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
    webSocketEventSubscription: EmitterSubscription;
    clientErrorEventHandler?: WebSocketClientErrorEventHandler;
    clientErrorSubscription: EmitterSubscription;

    constructor(url: string) {
        this.url = url;
        this.readyState = READY_STATE.CLOSED;
        this.webSocketEventSubscription = Emitter.addListener(
            EVENTS.READY_STATE_EVENT,
            (event: WebSocketEvent) => {
                if (event.url === this.url) {
                    this.readyState = event.message as WebSocketReadyState;
                }
            }
        );
        this.clientErrorSubscription = Emitter.addListener(
            EVENTS.CLIENT_ERROR,
            (event: WebSocketClientErrorEvent) => {
                if (event.url === this.url) {
                    if (this.clientErrorEventHandler) {
                        this.clientErrorEventHandler(event);
                    } else {
                        Alert.alert(
                            "Error",
                            `Code: ${event.errorCode}\nDescription: ${event.errorDescription}`,
                            [{ text: "OK" }],
                            {
                                cancelable: false,
                            }
                        );
                    }
                }
            }
        );
    }

    open = () => NativeWebSocketClient.connectFor(this.url);
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

    onClientError = (callback: WebSocketClientErrorEventHandler) => {
        this.clientErrorEventHandler = callback;
    };

    invalidate = (): Promise<void> => {
        this.webSocketEventSubscription.remove();
        this.clientErrorSubscription.remove();
        delete SOCKETS[this.url];

        return NativeWebSocketClient.invalidateClientFor(this.url);
    };
}

async function getOrCreateWebSocketClient(
    url: string,
    config: WebSocketClientConfiguration = {},
    validateUrl: boolean = true
): Promise<{ client: WebSocketClient; created: boolean }> {
    if (validateUrl && !isValidWebSocketURL(url)) {
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
