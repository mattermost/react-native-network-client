// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

enum APIClientEvents {
    UPLOAD_PROGRESS = "APIClient-UploadProgress",
    CLIENT_CERTIFICATE_MISSING = "APIClient-Client-Certificate-Missing",
}

enum RetryTypes {
    EXPONENTIAL_BACKOFF = "exponential",
}

type APIClientConstants = {
    EVENTS: typeof APIClientEvents;
    RETRY_TYPES: typeof RetryTypes;
};

interface NativeAPIClient extends NativeModule {
    getConstants(): APIClientConstants;

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
