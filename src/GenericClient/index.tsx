// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';

const {GenericClient: NativeGenericClient} = NativeModules;

/**
 * Generic client for making requests
 */
class GenericClient implements GenericClientInterface {
  get = (url: string, options?: RequestOptions): Promise<ClientResponse> => NativeGenericClient.get(url, options);
  put = (url: string, options?: RequestOptions): Promise<ClientResponse> => NativeGenericClient.put(url, options);
  post = (url: string, options?: RequestOptions): Promise<ClientResponse> => NativeGenericClient.post(url, options);
  patch = (url: string, options?: RequestOptions): Promise<ClientResponse> => NativeGenericClient.patch(url, options);
  delete = (url: string, options?: RequestOptions): Promise<ClientResponse> => NativeGenericClient.delete(url, options);
}

export default new GenericClient();