// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";

const { RNNCGenericClient } = NativeModules;

/**
 * Generic client for making requests
 */
class GenericClient implements GenericClientInterface {
    get = (url: string, options?: RequestOptions): Promise<ClientResponse> =>
        RNNCGenericClient.get(url, options);
    put = (url: string, options?: RequestOptions): Promise<ClientResponse> =>
        RNNCGenericClient.put(url, options);
    post = (url: string, options?: RequestOptions): Promise<ClientResponse> =>
        RNNCGenericClient.post(url, options);
    patch = (url: string, options?: RequestOptions): Promise<ClientResponse> =>
        RNNCGenericClient.patch(url, options);
    delete = (url: string, options?: RequestOptions): Promise<ClientResponse> =>
        RNNCGenericClient.delete(url, options);
}

export default new GenericClient();
