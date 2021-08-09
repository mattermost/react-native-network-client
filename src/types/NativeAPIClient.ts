// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {
    APIClientConfiguration,
    ClientHeaders,
    ClientResponse,
    RequestOptions,
    UploadRequestOptions,
} from "./APIClient";

export enum APIClientEvents {
    DOWNLOAD_PROGRESS = "APIClient-DownloadProgress",
    UPLOAD_PROGRESS = "APIClient-UploadProgress",
    CLIENT_ERROR = "APIClient-Error",
}

export enum RetryTypes {
    EXPONENTIAL_RETRY = "exponential",
    LINEAR_RETRY = "linear",
}

type APIClientConstants = {
    EVENTS: typeof APIClientEvents;
    RETRY_TYPES: typeof RetryTypes;
};

export interface NativeAPIClient extends NativeModule {
    getConstants(): APIClientConstants;

    head(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    get(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    put(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    post(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    patch(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    delete(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    upload(
        baseUrl: string,
        endpoint: string | null,
        fileUrl: string,
        taskId: string,
        options?: UploadRequestOptions
    ): Promise<ClientResponse>;
    download(
        baseUrl: string,
        endpoint: string | null,
        filePath: string,
        taskId: string,
        options?: RequestOptions
    ): Promise<ClientResponse>;
    cancelRequest(taskId: string): void;

    createClientFor(
        baseUrl: string,
        config?: APIClientConfiguration
    ): Promise<void>;

    getClientHeadersFor(baseUrl: string): Promise<ClientHeaders>;
    addClientHeadersFor(baseUrl: string, headers: ClientHeaders): Promise<void>;
    importClientP12For(
        baseUrl: string,
        path: string,
        password?: string
    ): Promise<void>;
    invalidateClientFor(baseUrl: string): Promise<void>;
}
