// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type ClientHeaders = Record<string, string>;

type RequestOptions = {
    headers?: ClientHeaders;
    body?: Record<string, unknown> | string;
    timeoutInterval?: number;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
};

type ClientResponse = {
    headers?: ClientHeaders;
    data?: Record<string, unknown>;
    code: number;
    lastRequestedUrl: string;
};

interface GenericClientInterface {
    get(url: string, options?: RequestOptions): Promise<ClientResponse>;
    put(url: string, options?: RequestOptions): Promise<ClientResponse>;
    post(url: string, options?: RequestOptions): Promise<ClientResponse>;
    patch(url: string, options?: RequestOptions): Promise<ClientResponse>;
    delete(url: string, options?: RequestOptions): Promise<ClientResponse>;
}

interface APIClientInterface {
    baseUrl: string;
    config: APIClientConfiguration;

    get(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    put(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    post(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    patch(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    delete(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;

    getHeaders(): Promise<ClientHeaders>;
    addHeaders(headers: ClientHeaders): Promise<void>;
    invalidate(): Promise<void>;
}

type SessionConfiguration = {
    followRedirects?: boolean;
    allowsCellularAccess?: boolean;
    waitsForConnectivity?: boolean;
    timeoutIntervalForRequest?: number;
    timeoutIntervalForResource?: number;
    httpMaximumConnectionsPerHost?: number;
    cancelRequestsOnUnauthorized?: boolean;
};

enum RETRY_POLICY_TYPE {
    EXPONENTIAL = "exponential",
};
type RetryPolicyConfiguration = {
    type?: RETRY_POLICY_TYPE;
    retryLimit?: number;
    exponentialBackoffBase?: number;
    exponentialBackoffScale?: number;
}

type iOSAPIClientConfiguration = {
    headers?: ClientHeaders;
    sessionConfiguration?: SessionConfiguration;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
    requestInterceptorConfig?: Record<string, string>;
    serverTrustManagerConfig?: Record<string, string>;
    cachedResponseHandlerConfig?: Record<string, string>;
};

type AndroidAPIClientConfiguration = {
    headers?: ClientHeaders;
    followRedirects?: boolean;
    timeoutIntervalForRequest?: number;
    timeoutIntervalForResource?: number;
    [key: string]: unknown;
};

type APIClientConfiguration =
    | iOSAPIClientConfiguration
    | AndroidAPIClientConfiguration;
