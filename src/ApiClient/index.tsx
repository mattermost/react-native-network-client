// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";
import isURL from "validator/es/lib/isURL";

const { RNNCAPIClient } = NativeModules;

const CLIENTS: { [key: string]: APIClient } = {};

const DEFAULT_API_CLIENT_CONFIG: APIClientConfiguration = {
    sessionConfiguration: {
        followRedirects: true,
        allowsCellularAccess: true,
        waitsForConnectivity: false,
        timeoutIntervalForRequest: 30,
        timeoutIntervalForResource: 30,
        httpMaximumConnectionsPerHost: 10,
        cancelRequestsOnUnauthorized: false,
    },
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

    getHeaders = (): Promise<ClientHeaders> =>
        RNNCAPIClient.getClientHeadersFor(this.baseUrl);
    addHeaders = (headers: ClientHeaders): Promise<void> => {
        this.config.headers = {
            ...(this.config.headers as Record<string, string>),
            ...headers,
        };

        return RNNCAPIClient.addClientHeadersFor(this.baseUrl, headers);
    };
    invalidate = (): Promise<void> => {
        delete CLIENTS[this.baseUrl];

        return RNNCAPIClient.invalidateClientFor(this.baseUrl);
    };

    get = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        RNNCAPIClient.get(this.baseUrl, endpoint, options);
    put = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        RNNCAPIClient.put(this.baseUrl, endpoint, options);
    post = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        RNNCAPIClient.post(this.baseUrl, endpoint, options);
    patch = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        RNNCAPIClient.patch(this.baseUrl, endpoint, options);
    delete = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        RNNCAPIClient.delete(this.baseUrl, endpoint, options);
}

async function getOrCreateAPIClient(
    baseUrl: string,
    config: APIClientConfiguration = {}
): Promise<{ client: APIClient; created: boolean }> {
    if (!isValidBaseURL(baseUrl)) {
        throw new Error("baseUrl must be a valid API base URL");
    }

    let created = false;
    let client = CLIENTS[baseUrl];
    if (!client) {
        client = new APIClient(baseUrl, config);
        await RNNCAPIClient.createClientFor(client.baseUrl, client.config);
        CLIENTS[baseUrl] = client;
        created = true;
    }

    return { client, created };
}

const isValidBaseURL = (baseUrl: string) => {
    return isURL(baseUrl, {
        protocols: ["http", "https"],
        require_protocol: true,
        require_valid_protocol: true,
        require_host: true,
    });
};

export { getOrCreateAPIClient };
