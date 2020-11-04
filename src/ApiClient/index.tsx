// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';
import isURL from 'validator/es/lib/isURL';

import type {
  RequestOptions,
  Response,
  GenericClientInterface,
  ApiClientInterface,
  ApiClientConfiguration,
} from './types';

const {NetworkClient} = NativeModules;

const CLIENTS: {[key: string]: ApiClient} = {};

class UndefinedClient extends Error {
  constructor(baseUrl: string) {
    super();
    this.name = 'UndefinedClient';
    this.message = `Client for ${baseUrl} not found.`;
  }
}

/**
 * Generic client for making GET requests
 */
class GenericClient implements GenericClientInterface {
  get = (url: string, options?: RequestOptions) => NetworkClient.get(url, null, options);
}

/**
 * Configurable client for consuming a REST API
 */
class ApiClient implements ApiClientInterface {
  baseUrl: string;

  constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
  }

  getHeaders = (): Promise<object> => NetworkClient.getApiClientHeadersFor(this.baseUrl);
  addHeaders = (headers: object): void => NetworkClient.addApiClientHeadersFor(this.baseUrl, headers);

  get = (endpoint: string, options?: RequestOptions): Promise<Response> => {
    if (!CLIENTS[this.baseUrl]) {
      return Promise.reject(new UndefinedClient(this.baseUrl));
    }
    
    return NetworkClient.get(this.baseUrl, endpoint, options);
  }

  put = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.put(this.baseUrl, endpoint, options);
  post = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.post(this.baseUrl, endpoint, options);
  patch = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.patch(this.baseUrl, endpoint, options);
  delete = (endpoint: string, options?: RequestOptions): Promise<Response> => NetworkClient.delete(this.baseUrl, endpoint, options);
}

async function getOrCreateApiClient(baseUrl: string, config: ApiClientConfiguration = {}): Promise<ApiClient>  {
    if (!isValidBaseURL(baseUrl)) {
      throw new Error('baseUrl must be a valid API base URL');
    }

    let networkClient = CLIENTS[baseUrl];
    if (!networkClient) {
        await NetworkClient.createApiClientFor(baseUrl, config);
        networkClient = new ApiClient(baseUrl);
        CLIENTS[baseUrl] = networkClient;
    }

    return networkClient;
}

function removeApiClient(client: ApiClient): Promise<void> {
  delete CLIENTS[client.baseUrl];
  return NetworkClient.removeApiClientFor(client.baseUrl);
}

const isValidBaseURL = (baseUrl: string) => {
  return isURL(baseUrl, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    require_host: true,
  });
}

export {
  GenericClient,
  getOrCreateApiClient,
  removeApiClient,
};
