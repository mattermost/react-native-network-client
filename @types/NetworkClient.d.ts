// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
interface NetworkClient {
    get(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    put(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    post(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    patch(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;
    delete(baseUrl: string, endpoint: string | null, options?: RequestOptions): Promise<Response>;

    getApiClientHeadersFor(baseUrl: string): Promise<Headers>;
    addApiClientHeadersFor(baseUrl: string, headers: Headers): Promise<void>;
    createApiClientFor(baseUrl: string, config?: ApiClientConfiguration): Promise<void>;

    disconnectWebSocketFor(wsUrl: string);
    createWebSocketClientFor(wsUrl: string, callbacks: WebSocketCallbacks, config?: WebSocketClientConfiguration);
}