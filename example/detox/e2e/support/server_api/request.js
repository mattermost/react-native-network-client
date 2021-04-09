// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import client from "./client";
import secureClient from "./secure_client";
import { getResponseFromError } from "./common";

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
export const apiDelete = async (
    options = {
        url: "",
        subpath: "",
        params: null,
        headers: null,
        body: null,
        responseStatus: 200,
        secure: false,
    }
) => {
    return await apiRequest("delete", options);
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
export const apiGet = async (
    options = {
        url: "",
        subpath: "",
        params: null,
        headers: null,
        body: null,
        responseStatus: 200,
        secure: false,
    }
) => {
    return await apiRequest("get", options);
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
export const apiPatch = async (
    options = {
        url: "",
        subpath: "",
        params: null,
        headers: null,
        body: null,
        responseStatus: 200,
        secure: false,
    }
) => {
    return await apiRequest("patch", options);
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
export const apiPost = async (
    options = {
        url: "",
        subpath: "",
        params: null,
        headers: null,
        body: null,
        responseStatus: 200,
        secure: false,
    }
) => {
    return await apiRequest("post", options);
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
export const apiPut = async (
    options = {
        url: "",
        subpath: "",
        params: null,
        headers: null,
        body: null,
        responseStatus: 200,
        secure: false,
    }
) => {
    return await apiRequest("put", options);
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
const apiRequest = async (
    method = "get",
    {
        url = "",
        subpath = "",
        params = {},
        headers = {},
        body = {},
        responseStatus = 200,
        secure = false,
    } = {}
) => {
    try {
        const requestHeaders = {
            responseStatus,
            ...headers,
        };
        if (!url) {
            url = `/${method}`;
        }
        const apiClient = secure ? secureClient : client;
        return await apiClient.request({
            method,
            url: `${url}${subpath}`,
            params,
            headers: requestHeaders,
            data: body,
        });
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
