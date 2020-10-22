// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable @typescript-eslint/no-explicit-any */

import {NativeModules} from 'react-native';

const {NetworkClient} = NativeModules;

/**
 * Generic client for making GET requests
 */
class GenericClient {
  get = (url: string, options?: object) => NetworkClient.get(url, null, options);
}

export interface ApiClientInterface {
  get(endpoint: string, options?: object): any;
  post(endpoint: string, options?: object, body?: object): any;
}

/**
 * Configurable client for consuming a REST API
 */
class ApiClient implements ApiClientInterface {
  rootUrl: string;

  constructor(rootUrl: string) {
      this.rootUrl = rootUrl;
  }

  get = (endpoint: string, options?: object) => NetworkClient.get(this.rootUrl, endpoint, options);

  post = (endpoint: string, options?: object, body?: object) => NetworkClient.post(this.rootUrl, endpoint, options, body);
}

export interface WebSocketInterface {
    wsUrl: string;
  }

/**
 * Configurable Websocket client
 */
class Socket implements WebSocketInterface {
    wsUrl: string;

    constructor(wsUrl: string) {
        this.wsUrl = wsUrl;
    }

    disconnect = () => NetworkClient.disconnectSocketFor(this.wsUrl);
}

const CLIENTS: {[key: string]: any} = {};
const SOCKETS: {[key: string]: any} = {};

async function getOrCreateNetworkClient(rootUrl: string, options: object = {}) {
    let networkClient = CLIENTS[rootUrl];
    if (!networkClient) {
        await NetworkClient.createClientFor(rootUrl, options);
        networkClient = new ApiClient(rootUrl);
        CLIENTS[rootUrl] = networkClient;
    }

    return networkClient;
}

type WebSocketCallbacks = {
    onConnect(): void;
    onDisconnect(): void;
    onEvent(event: string, data: any): void;
}

async function getOrCreateWebSocket(wsUrl: string, options: object = {}, callbacks: WebSocketCallbacks) {
    let socket = SOCKETS[wsUrl];
    if (!socket) {
        await NetworkClient.createWebsocketFor(wsUrl, options, callbacks);
        socket = new Socket(wsUrl);
        SOCKETS[wsUrl] = socket;
    }

    return socket;
}

export default new GenericClient();
export {
    getOrCreateNetworkClient,
    getOrCreateWebSocket,
};
