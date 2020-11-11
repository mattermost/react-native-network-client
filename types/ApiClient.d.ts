// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type RequestOptions = {
    headers?: Record<string, string>;
    body?: Record<string, string>;
};

type Headers = Record<string, string>;

type Response = {
    headers?: Headers;
    data?: Record<string, string>;
    code: Int;
    lastRequestedUrl: string;
};

interface GenericClientInterface {
    get(endpoint: string, options?: RequestOptions): Promise<Response>;
};

interface ApiClientInterface {
    get(endpoint: string, options?: RequestOptions): Promise<Response>;
    put(endpoint: string, options?: RequestOptions): Promise<Response>;
    post(endpoint: string, options?: RequestOptions): Promise<Response>;
    patch(endpoint: string, options?: RequestOptions): Promise<Response>;
    delete(endpoint: string, options?: RequestOptions): Promise<Response>;

    getHeaders(): Promise<Headers>;
    addHeaders(headers: Headers): Promise<void>;
};

type RedirectHandlerConfig = {
    follow: boolean;
};

type iOSApiClientConfiguration = {
    headers?: Headers;
    redirectHandlerConfig?: RedirectHandlerConfig;
    requestInterceptorConfig?: Record<string, string>;
    serverTrustManagerConfig?: Record<string, string>;
    cachedResponseHandlerConfig?: Record<string, string>;
};
type AndroidApiClientConfiguration = Partial<Record<string, Record<string, string>>>;

type ApiClientConfiguration = iOSApiClientConfiguration | AndroidApiClientConfiguration;
