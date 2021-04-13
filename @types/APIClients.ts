// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

interface ProgressPromise<T> extends Promise<T> {
    progress?: (
        callback: (fractionCompleted: number) => void
    ) => ProgressPromise<T>;
    onProgress?: (fractionCompleted: number) => void;
    cancel?: () => void;
}

type ClientHeaders = Record<string, string>;

type RequestOptions = {
    headers?: ClientHeaders;
    body?: Record<string, unknown> | string;
    timeoutInterval?: number;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
};

type MultipartUploadConfig = {
    fileKey?: string;
    data?: Record<string, string>;
};

type UploadRequestOptions = RequestOptions & {
    skipBytes?: number;
    method?: string;
    multipart?: MultipartUploadConfig;
};

type ClientResponse = {
    headers?: ClientHeaders;
    data?: Record<string, unknown>;
    code: number;
    lastRequestedUrl: string;
    ok: boolean;
    retriesExhausted?: boolean;
};

type ClientResponseError = {
    code: number;
    message: string;
    domain: string;
    userInfo?: Record<string, unknown>;
    nativeStackAndroid?: Array<unknown>;
    nativeStackIOS?: Array<unknown>;
};

type APIClientErrorEventHandler = (event: APIClientErrorEvent) => void;

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

    onClientErrorSubscription?: EmitterSubscription;
    onClientError(callback: APIClientErrorEventHandler): void;

    get(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    put(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    post(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    patch(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    delete(endpoint: string, options?: RequestOptions): Promise<ClientResponse>;
    upload(
        endpoint: string,
        fileUrl: string,
        options?: UploadRequestOptions
    ): ProgressPromise<ClientResponse>;

    getHeaders(): Promise<ClientHeaders>;
    addHeaders(headers: ClientHeaders): Promise<void>;
    importClientP12(path: string, password?: string): Promise<void>;
    invalidate(): Promise<void>;
}

type ClientP12Configuration = {
    path: string;
    password?: string;
};

type SessionConfiguration = {
    followRedirects?: boolean;
    allowsCellularAccess?: boolean;
    waitsForConnectivity?: boolean;
    timeoutIntervalForRequest?: number;
    timeoutIntervalForResource?: number;
    httpMaximumConnectionsPerHost?: number;
    cancelRequestsOnUnauthorized?: boolean;
    trustSelfSignedServerCertificate?: boolean;
};

type RetryPolicyConfiguration = {
    type?: RetryTypes;
    retryLimit?: number;
    retryInterval?: number;
    exponentialBackoffBase?: number;
    exponentialBackoffScale?: number;
    statusCodes?: number[];
    retryMethods?: string[];
};

type RequestAdapterConfiguration = {
    bearerAuthTokenResponseHeader?: string;
};

type APIClientConfiguration = {
    headers?: ClientHeaders;
    sessionConfiguration?: SessionConfiguration;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
    requestAdapterConfiguration?: RequestAdapterConfiguration;
    serverTrustManagerConfig?: Record<string, string>;
    cachedResponseHandlerConfig?: Record<string, string>;
    clientP12Configuration?: ClientP12Configuration;
};

type UploadProgressEvent = {
    taskId: string;
    fractionCompleted: number;
};

type MissingClientCertificateEvent = {
    serverUrl: string;
};

type APIClientErrorEvent = {
    serverUrl: string;
    errorCode: number;
    errorDescription: string;
};
