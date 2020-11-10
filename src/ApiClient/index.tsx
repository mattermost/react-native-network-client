// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NativeModules} from 'react-native';
import isURL from 'validator/es/lib/isURL';

import type {
  RequestOptions,
  Response,
  GenericClientInterface,
  APIClientInterface,
  APIClientConfiguration,
} from './types';

const {
  GenericClient: NativeGenericClient,
  APIClient: NativeAPIClient,
} = NativeModules;

const CLIENTS: {[key: string]: APIClient} = {};

/**
 * Generic client for making GET requests
 */
class GenericClient implements GenericClientInterface {
  get = (url: string, options?: RequestOptions) => NativeGenericClient.get(url, options);
}

/**
 * Configurable client for consuming a REST API
 */
class APIClient implements APIClientInterface {
  baseUrl: string;

  constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
  }

  getHeaders = (): Promise<object> => NativeAPIClient.getClientHeadersFor(this.baseUrl);
  addHeaders = (headers: object): Promise<void> => NativeAPIClient.addClientHeadersFor(this.baseUrl, headers);
  invalidate = (): Promise<void> => {
    delete CLIENTS[this.baseUrl];

    return NativeAPIClient.invalidateClientFor(this.baseUrl);
  }

  get = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.get(this.baseUrl, endpoint, options);
  put = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.put(this.baseUrl, endpoint, options);
  post = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.post(this.baseUrl, endpoint, options);
  patch = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.patch(this.baseUrl, endpoint, options);
  delete = (endpoint: string, options?: RequestOptions): Promise<Response> => NativeAPIClient.delete(this.baseUrl, endpoint, options);
}

async function getOrCreateAPIClient(baseUrl: string, config: APIClientConfiguration = {}): Promise<{client: APIClient, created: boolean}>  {
    if (!isValidBaseURL(baseUrl)) {
      throw new Error('baseUrl must be a valid API base URL');
    }

    let created = false;
    let client = CLIENTS[baseUrl];
    if (!client) {
        await NativeAPIClient.createClientFor(baseUrl, config);
        created = true;
        client = new APIClient(baseUrl);
        CLIENTS[baseUrl] = client;
    }

    return {client, created};
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
  getOrCreateAPIClient,
};
