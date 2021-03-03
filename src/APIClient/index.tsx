// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeEventEmitter, NativeModules } from "react-native";
import isURL from "validator/es/lib/isURL";

const { APIClient: NativeAPIClient } = NativeModules;
const Emitter = new NativeEventEmitter(NativeAPIClient);

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

const generateUploadTaskId = () =>
    Math.random().toString(36).slice(-10) +
    Math.random().toString(36).slice(-10);

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
        NativeAPIClient.getClientHeadersFor(this.baseUrl);
    addHeaders = (headers: ClientHeaders): Promise<void> => {
        this.config.headers = {
            ...(this.config.headers as Record<string, string>),
            ...headers,
        };

        return NativeAPIClient.addClientHeadersFor(this.baseUrl, headers);
    };
    importClientP12 = (path: string, password?: string): Promise<void> => {
        return NativeAPIClient.importClientP12For(this.baseUrl, path, password);
    };
    invalidate = (): Promise<void> => {
        delete CLIENTS[this.baseUrl];

        return NativeAPIClient.invalidateClientFor(this.baseUrl);
    };

    get = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        NativeAPIClient.get(this.baseUrl, endpoint, options);
    put = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        NativeAPIClient.put(this.baseUrl, endpoint, options);
    post = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        NativeAPIClient.post(this.baseUrl, endpoint, options);
    patch = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        NativeAPIClient.patch(this.baseUrl, endpoint, options);
    delete = (
        endpoint: string,
        options?: RequestOptions
    ): Promise<ClientResponse> =>
        NativeAPIClient.delete(this.baseUrl, endpoint, options);
    upload = (
        endpoint: string,
        fileUrl: string,
        options?: UploadRequestOptions
    ): ProgressPromise<ClientResponse> => {
        const taskId = generateUploadTaskId();
        const promise: ProgressPromise<ClientResponse> = new Promise(
            (resolve, reject) => {
                const uploadSubscription = Emitter.addListener(
                    "NativeClient-UploadProgress",
                    (e: UploadProgressEvent) => {
                        if (e.taskId === taskId && promise.onProgress) {
                            promise.onProgress(e.fractionCompleted);
                        }
                    }
                );

                NativeAPIClient.upload(
                    this.baseUrl,
                    endpoint,
                    fileUrl,
                    taskId,
                    options
                )
                    .then((response) => resolve(response))
                    .catch((error) => reject(error))
                    .finally(() => {
                        uploadSubscription.remove();
                        delete promise.progress;
                    });
            }
        );

        promise.progress = (fn) => {
            promise.onProgress = fn;
            return promise;
        };

        promise.cancel = () => NativeAPIClient.cancelRequest(taskId);

        return promise;
    };
}

async function getOrCreateAPIClient(
    baseUrl: string,
    config: APIClientConfiguration = {},
    validateUrl: boolean = true
): Promise<{ client: APIClient; created: boolean }> {
    if (validateUrl && !isValidBaseURL(baseUrl)) {
        throw new Error("baseUrl must be a valid API base URL");
    }

    let created = false;
    let client = CLIENTS[baseUrl];
    if (!client) {
        client = new APIClient(baseUrl, config);
        await NativeAPIClient.createClientFor(client.baseUrl, client.config);
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
