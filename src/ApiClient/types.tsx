// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RequestOptions = {
    headers?: object;
    body?: any;
}

export interface GenericClientInterface {
    get(endpoint: string, options?: RequestOptions): any;
}

export interface ApiClientInterface {
    get(endpoint: string, options?: RequestOptions): any;
    put(endpoint: string, options?: RequestOptions): any;
    post(endpoint: string, options?: RequestOptions): any;
    patch(endpoint: string, options?: RequestOptions): any;
    delete(endpoint: string, options?: RequestOptions): any;

    getHeaders(): any;
    addHeaders(headers: object): any;
}

type iOSApiClientConfiguration = {
    redirectHandlerConfig?: object;
    requestInterceptorConfig?: object;
    serverTrustManagerConfig?: object;
    cachedResponseHandlerConfig?: object;
};
type AndroidApiClientConfiguration = {};

export type ApiClientConfiguration = iOSApiClientConfiguration | AndroidApiClientConfiguration;
