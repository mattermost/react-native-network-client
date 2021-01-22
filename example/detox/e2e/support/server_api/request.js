// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import client from './client';
import {getResponseFromError, toHttpStatusString} from './common';

// ****************************************************************
// Request Methods
// See https://github.com/mattermost/react-native-network-client/blob/master/example/MOCKSERVER.md#request-methods
//
// Exported API function should have the following:
// - documented using JSDoc
// - meaningful description
// - match the referenced API endpoints
// - parameter/s defined by `@param`
// - return value defined by `@return`
// ****************************************************************

/**
 * Delete request.
 * See https://github.com/mattermost/react-native-network-client/blob/master/example/MOCKSERVER.md#delete-request
 * @param {string} options.url - absolute or relative url
 * @param {string} options.subpath - subpath relative to url
 * @param {Array} options.params - request parameters
 * @param {Object} options.headers - request headers
 * @param {number} options.responseStatus - expected response status code
 * @return {Object} response object
 */
export const apiDelete = (options = {
    url: '',
    subpath: '',
    params: null,
    headers: null,
    body: null,
    responseStatus: 200,
}) => {
    return apiRequest('delete', options);
};

/**
 * Get request.
 * See https://github.com/mattermost/react-native-network-client/blob/master/example/MOCKSERVER.md#get-request
 * @param {string} options.url - absolute or relative url
 * @param {string} options.subpath - subpath relative to url
 * @param {Array} options.params - request parameters
 * @param {Object} options.headers - request headers
 * @param {number} options.responseStatus - expected response status code
 * @return {Object} response object
 */
export const apiGet = (options = {
    url: '',
    subpath: '',
    params: null,
    headers: null,
    body: null,
    responseStatus: 200,
}) => {
    return apiRequest('get', options);
};

/**
 * Patch request.
 * See https://github.com/mattermost/react-native-network-client/blob/master/example/MOCKSERVER.md#patch-request
 * @param {string} options.url - absolute or relative url
 * @param {string} options.subpath - subpath relative to url
 * @param {Array} options.params - request parameters
 * @param {Object} options.headers - request headers
 * @param {Object} options.body - request body
 * @param {number} options.responseStatus - expected response status code
 * @return {Object} response object
 */
export const apiPatch = (options = {
    url: '',
    subpath: '',
    params: null,
    headers: null,
    body: null,
    responseStatus: 200,
}) => {
    return apiRequest('patch', options);
};

/**
 * Post request.
 * See https://github.com/mattermost/react-native-network-client/blob/master/example/MOCKSERVER.md#post-request
 * @param {string} options.url - absolute or relative url
 * @param {string} options.subpath - subpath relative to url
 * @param {Array} options.params - request parameters
 * @param {Object} options.headers - request headers
 * @param {Object} options.body - request body
 * @param {number} options.responseStatus - expected response status code
 * @return {Object} response object
 */
export const apiPost = (options = {
    url: '',
    subpath: '',
    params: null,
    headers: null,
    body: null,
    responseStatus: 200,
}) => {
    return apiRequest('post', options);
};

/**
 * Put request.
 * See https://github.com/mattermost/react-native-network-client/blob/master/example/MOCKSERVER.md#put-request
 * @param {string} options.url - absolute or relative url
 * @param {string} options.subpath - subpath relative to url
 * @param {Array} options.params - request parameters
 * @param {Object} options.headers - request headers
 * @param {Object} options.body - request body
 * @param {number} options.responseStatus - expected response status code
 * @return {Object} response object
 */
export const apiPut = (options = {
    url: '',
    subpath: '',
    params: null,
    headers: null,
    body: null,
    responseStatus: 200,
}) => {
    return apiRequest('put', options);
};

/**
 * Generic request.
 * @param {string} method - request method
 * @param {string} options.url - absolute or relative url
 * @param {string} options.subpath - subpath relative to url
 * @param {Array} options.params - request parameters
 * @param {Object} options.headers - request headers
 * @param {number} options.responseStatus - expected response status code
 * @return {Object} response object
 */
const apiRequest = async (method = 'get', {
    url = '',
    subpath = '',
    params = {},
    headers = {},
    body = {},
    responseStatus = 200,
} = {}) => {
    try {
        const requestHeaders = {
            'response-status': toHttpStatusString(responseStatus),
            ...headers
        }
        if (!url) {
            url = `/${method}`;
        }
        return await client.request(
            {
                method: method,
                url: `${url}${subpath}`,
                params: params,
                headers: requestHeaders,
                data: body,
            },
        );
    } catch (err) {
        return getResponseFromError(err);
    }
};

export const Request = {
    apiDelete,
    apiGet,
    apiPatch,
    apiPost,
    apiPut,
};

export default Request;
