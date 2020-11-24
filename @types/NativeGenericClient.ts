// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
interface NativeGenericClient {
    get(baseUrl: string, options?: RequestOptions): Promise<ClientResponse>;
    put(baseUrl: string, options?: RequestOptions): Promise<ClientResponse>;
    post(baseUrl: string, options?: RequestOptions): Promise<ClientResponse>;
    patch(baseUrl: string, options?: RequestOptions): Promise<ClientResponse>;
    delete(baseUrl: string, options?: RequestOptions): Promise<ClientResponse>;
}
