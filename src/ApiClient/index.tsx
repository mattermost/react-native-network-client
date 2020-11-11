// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';
import isURL from 'validator/es/lib/isURL';

const {NetworkClient} = NativeModules;

/**
 * Generic client for making GET requests
 */
class GenericClient implements GenericClientInterface {
    get = (url: string, options?: RequestOptions): Promise<Response> => NetworkClient.get(url, null, options);
    put = (url: string, options?: RequestOptions): Promise<Response> => NetworkClient.put(url, null, options);
    post = (url: string, options?: RequestOptions): Promise<Response> => NetworkClient.post(url, null, options);
    patch = (url: string, options?: RequestOptions): Promise<Response> => NetworkClient.patch(url, null, options);
    delete = (url: string, options?: RequestOptions): Promise<Response> => NetworkClient.delete(url, null, options);
}

const DEFAULT_API_CLIENT_CONFIG: ApiClientConfiguration = {
    followRedirects: true,
};

/**
 * Configurable client for consuming a REST API
 */
class ApiClient implements ApiClientInterface {
    baseUrl: string;
    config: ApiClientConfiguration;

    constructor(baseUrl: string, config: ApiClientConfiguration = {}) {
        this.baseUrl = baseUrl;
        this.config = Object.assign({}, DEFAULT_API_CLIENT_CONFIG, config);
    }

    getHeaders = (): Promise<Headers> => NetworkClient.getApiClientHeadersFor(this.baseUrl);
    addHeaders = (headers: Headers): Promise<void> => {
        this.config.headers = {
            ...this.config.headers,
            ...headers,
        };

        return NetworkClient.addApiClientHeadersFor(this.baseUrl, headers);
    }

    get = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.get(this.baseUrl, endpoint, options);
    put = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.put(this.baseUrl, endpoint, options);
    post = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.post(this.baseUrl, endpoint, options);
    patch = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.patch(this.baseUrl, endpoint, options);
    delete = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.delete(this.baseUrl, endpoint, options);
}

const CLIENTS: {[key: string]: ApiClient} = {};

async function getOrCreateApiClient(baseUrl: string, config: ApiClientConfiguration = {}): Promise<ApiClient> {
    if (!isValidBaseURL(baseUrl)) {
        throw new Error('baseUrl must be a valid API base URL');
    }

    let networkClient = CLIENTS[baseUrl];
    if (!networkClient) {
        await NetworkClient.createApiClientFor(baseUrl, config);
        networkClient = new ApiClient(baseUrl, config);
        CLIENTS[baseUrl] = networkClient;
    }

    return networkClient;
}

const isValidBaseURL = (baseUrl: string) => {
    return isURL(baseUrl, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true,
        require_host: true,
    });
};

export {
    GenericClient,
    getOrCreateApiClient,
};
