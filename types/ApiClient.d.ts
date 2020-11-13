// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type RequestOptions = {
    headers?: Record<string, string>;
    body?: Record<string, string>;
    timeoutInterval?: number;
};

type Headers = Record<string, string>;

type Response = {
    headers?: Headers;
    data?: Record<string, string>;
    code: Int;
    lastRequestedUrl: string;
};

interface GenericClientInterface {
    get(url: string, options?: RequestOptions): Promise<Response>;
    put(url: string, options?: RequestOptions): Promise<Response>;
    post(url: string, options?: RequestOptions): Promise<Response>;
    patch(url: string, options?: RequestOptions): Promise<Response>;
    delete(url: string, options?: RequestOptions): Promise<Response>;
};

interface APIClientInterface {
    baseUrl: string;
    config: APIClientConfiguration;

    get(endpoint: string, options?: RequestOptions): Promise<Response>;
    put(endpoint: string, options?: RequestOptions): Promise<Response>;
    post(endpoint: string, options?: RequestOptions): Promise<Response>;
    patch(endpoint: string, options?: RequestOptions): Promise<Response>;
    delete(endpoint: string, options?: RequestOptions): Promise<Response>;

    getHeaders(): Promise<Headers>;
    addHeaders(headers: Headers): Promise<void>;
    invalidate(): Promise<void>;
};

type iOSAPIClientConfiguration = {
    headers?: Headers;
    followRedirects: boolean;
    allowsCellularAccess: boolean;
    waitsForConnectivity: boolean;
    timeoutIntervalForRequest: number;
    timeoutIntervalForResource: number;
    httpMaximumConnectionsPerHost: number;
    requestInterceptorConfig?: Record<string, string>;
    serverTrustManagerConfig?: Record<string, string>;
    cachedResponseHandlerConfig?: Record<string, string>;
};
type AndroidAPIClientConfiguration = Partial<Record<string, Record<string, string>>>;

type APIClientConfiguration = iOSAPIClientConfiguration | AndroidAPIClientConfiguration;
