// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';
import isURL from 'validator/es/lib/isURL';

const {NetworkClient} = NativeModules;

/**
 * Configurable Websocket client
 */
class WebSocketClient implements WebSocketClientInterface {
    wsUrl: string;

    constructor(wsUrl: string) {
        this.wsUrl = wsUrl;
    }

    disconnect = () => NetworkClient.disconnectWebSocketFor(this.wsUrl);
}

const SOCKETS: {[key: string]: WebSocketClient} = {};

async function getOrCreateWebSocketClient(wsUrl: string, callbacks: WebSocketCallbacks, config: WebSocketClientConfiguration = {}): Promise<WebSocketClient> {
    if (!isValidWebSocketURL(wsUrl)) {
        throw new Error('baseUrl must be a valid WebSocket URL');
    }

    let websocket = SOCKETS[wsUrl];
    if (!websocket) {
        await NetworkClient.createWebSocketClientFor(wsUrl, callbacks, config);
        websocket = new WebSocketClient(wsUrl);
        SOCKETS[wsUrl] = websocket;
    }

    return websocket;
}

const isValidWebSocketURL = (wsUrl: string) => {
    return isURL(wsUrl, {
        protocols: ['ws', 'wss'],
        require_protocol: true,
        require_valid_protocol: true,
        require_host: true,
    });
};

export {getOrCreateWebSocketClient};
