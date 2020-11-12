// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';

const {GenericClient: NativeGenericClient} = NativeModules;

/**
 * Generic client for making requests
 */
class GenericClient implements GenericClientInterface {
  get = (url: string, options?: RequestOptions): Promise<Response> => NativeGenericClient.get(url, options);
  put = (url: string, options?: RequestOptions): Promise<Response> => NativeGenericClient.put(url, options);
  post = (url: string, options?: RequestOptions): Promise<Response> => NativeGenericClient.post(url, options);
  patch = (url: string, options?: RequestOptions): Promise<Response> => NativeGenericClient.patch(url, options);
  delete = (url: string, options?: RequestOptions): Promise<Response> => NativeGenericClient.delete(url, options);
}

export default new GenericClient();