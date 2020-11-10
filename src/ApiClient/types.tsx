// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RequestOptions = {
    headers?: object;
    body?: any;
}

export type Response = {
    headers?: object;
    data?: any,
}

export interface GenericClientInterface {
    get(endpoint: string, options?: RequestOptions): any;
}

export interface APIClientInterface {
    get(endpoint: string, options?: RequestOptions): any;
    put(endpoint: string, options?: RequestOptions): any;
    post(endpoint: string, options?: RequestOptions): any;
    patch(endpoint: string, options?: RequestOptions): any;
    delete(endpoint: string, options?: RequestOptions): any;

    getHeaders(): any;
    addHeaders(headers: object): any;
}

type iOSAPIClientConfiguration = {
    redirectHandlerConfig?: object;
    requestInterceptorConfig?: object;
    serverTrustManagerConfig?: object;
    cachedResponseHandlerConfig?: object;
};
type AndroidAPIClientConfiguration = {};

export type APIClientConfiguration = iOSAPIClientConfiguration | AndroidAPIClientConfiguration;
