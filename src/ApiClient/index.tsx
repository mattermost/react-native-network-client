// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';
import isURL from 'validator/es/lib/isURL';

const {APIClient: NativeAPIClient} = NativeModules;

const CLIENTS: {[key: string]: APIClient} = {};

const DEFAULT_API_CLIENT_CONFIG: APIClientConfiguration = {
    followRedirects: true,
    allowsCellularAccess: true,
    waitsForConnectivity: false,
    timeoutIntervalForRequest: 30,
    timeoutIntervalForResource: 30,
    httpMaximumConnectionsPerHost: 10,
};

/**
 * Configurable client for consuming a REST API
 */
class APIClient implements APIClientInterface {
    baseUrl: string;
    config: APIClientConfiguration;

    constructor(baseUrl: string, config: APIClientConfiguration = {}) {
        this.baseUrl = baseUrl;
        this.config = Object.assign({}, DEFAULT_API_CLIENT_CONFIG, config);
    }

    getHeaders = (): Promise<Headers> => NativeAPIClient.getClientHeadersFor(this.baseUrl);
    addHeaders = (headers: Headers): Promise<void> => {
        this.config.headers = {
            ...this.config.headers,
            ...headers,
        };

        return NativeAPIClient.addClientHeadersFor(this.baseUrl, headers);
    }
    invalidate = (): Promise<void> => {
        delete CLIENTS[this.baseUrl];

        return NativeAPIClient.invalidateClientFor(this.baseUrl);
    }

  get = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.get(this.baseUrl, endpoint, options);
  put = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.put(this.baseUrl, endpoint, options);
  post = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.post(this.baseUrl, endpoint, options);
  patch = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.patch(this.baseUrl, endpoint, options);
  delete = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.delete(this.baseUrl, endpoint, options);
}

async function getOrCreateAPIClient(baseUrl: string, config: APIClientConfiguration = {}): Promise<{client: APIClient, created: boolean}>  {
    if (!isValidBaseURL(baseUrl)) {
        throw new Error('baseUrl must be a valid API base URL');
    }

    let created = false;
    let client = CLIENTS[baseUrl];
    if (!client) {
        client = new APIClient(baseUrl, config);
        await NativeAPIClient.createClientFor(client.baseUrl, client.config);
        CLIENTS[baseUrl] = client;
        created = true;
    }

    return {client, created};
}

const isValidBaseURL = (baseUrl: string) => {
    return isURL(baseUrl, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true,
        require_host: true,
    });
};

export {getOrCreateAPIClient};
