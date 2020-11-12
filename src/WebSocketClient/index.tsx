// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';
import isURL from 'validator/es/lib/isURL';

// TODO: export a native WebSocket client
const {NetworkClient} = NativeModules;

const SOCKETS: {[key: string]: WebSocketClient} = {};

/**
 * Configurable Websocket client
 */
class WebSocketClient implements WebSocketClientInterface {
    wsUrl: string;

    constructor(wsUrl: string) {
        this.wsUrl = wsUrl;
    }

    disconnect = () => NetworkClient.disconnectWebSocketFor(this.wsUrl);
    invalidate = (): Promise<void> => {
      delete SOCKETS[this.wsUrl];
  
      return NetworkClient.invalidateWebSocketClientFor(this.baseUrl);
    }
}

async function getOrCreateWebSocketClient(wsUrl: string, callbacks: WebSocketCallbacks, config: WebSocketClientConfiguration = {}): Promise<{client: WebSocketClient, created: boolean}> {
    if (!isValidWebSocketURL(wsUrl)) {
        throw new Error('baseUrl must be a valid WebSocket URL');
    }

    let created = false;
    let websocket = SOCKETS[wsUrl];
    if (!websocket) {
        created = true;
        await NetworkClient.createWebSocketClientFor(wsUrl, callbacks, config);
        websocket = new WebSocketClient(wsUrl);
        SOCKETS[wsUrl] = websocket;
    }

    return {client: websocket, created};
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
