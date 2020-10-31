// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
interface NativeNetworkClient {
    get(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    put(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    post(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    patch(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    delete(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;

    getApiClientsList(): Promise<string[]>;
    createApiClientFor(baseUrl: string, config?: ApiClientConfiguration): Promise<void>;
    removeApiClientFor(baseUrl: string): Promise<void>;
    getApiClientHeadersFor(baseUrl: string): Promise<Headers>;
    addApiClientHeadersFor(baseUrl: string, headers: Headers): Promise<void>;

    getWebSocketClientsList(): Promise<string[]>;
    createWebSocketClientFor(wsUrl: string, callbacks: WebSocketCallbacks, config?: WebSocketClientConfiguration);
    disconnectWebSocketFor(wsUrl: string);
}