// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestExpect from 'expect';

import {
    ApiClientRequestScreen,
    GenericClientRequestScreen,
} from '@support/ui/screen';
import {isIos} from '@support/utils';

export const customHeaders = {
    'custom-header-1-key': 'custom-header-1-value',
    'custom-header-2-key': 'custom-header-2-value',
};
export const newHeaders = {
    'new-header-1-key': 'new-header-1-value',
    'new-header-2-key': 'new-header-2-value',
};
export const customBody = {
    'customField1key': 'customField1value',
    'customField2key': 'customField2value',
};

/**
 * Perform api client request.
 * @param {string} options.testPath - relative or absolute path
 * @param {Object} options.testHeaders - requeset headers
 * @param {Object} options.testBody - request body
 * @param {Object} options.testTimeoutInterval - client timeout interval
 * @param {Object} options.testRetry - client retry
 */
export const performApiClientRequest = async ({
    testPath,
    testHeaders,
    testBody = null,
    testTimeoutInterval = '60',
    testRetry = {retryLimit: '3', exponentialBackoffBase: '4', exponentialBackoffScale: '5'}
}) => {
    const {
        makeRequest,
        setBody,
        setHeaders,
        setPath,
        setRetry,
        setTimeoutInterval,
    } = ApiClientRequestScreen;

    // # Set all fields and make request
    await setPath(testPath);
    await setHeaders(testHeaders);
    if (testBody) {
        await setBody(JSON.stringify(testBody));
    }
    await setTimeoutInterval(testTimeoutInterval);
    await setRetry(testRetry);
    await makeRequest();
};

/**
 * Perform generic client request.
 * @param {string} options.testUrl - url of requested server
 * @param {Object} options.testHeaders - requeset headers
 * @param {Object} options.testBody - request body
 * @param {Object} options.testTimeoutInterval - client timeout interval
 * @param {Object} options.testRetry - client retry
 */
export const performGenericClientRequest = async ({
    testUrl,
    testHeaders,
    testBody = null,
    testTimeoutInterval = '60',
    testRetry = {retryLimit: '3', exponentialBackoffBase: '4', exponentialBackoffScale: '5'}
}) => {
    const {
        makeRequest,
        setBody,
        setHeaders,
        setRetry,
        setTimeoutInterval,
        setUrl,
    } = GenericClientRequestScreen;

    // # Set all fields and make request
    await setUrl(testUrl);
    await setHeaders(testHeaders);
    if (testBody) {
        await setBody(JSON.stringify(testBody));
    }
    await setTimeoutInterval(testTimeoutInterval);
    await setRetry(testRetry);
    await makeRequest();
};

/**
 * Verify API response.
 * @param {Object} apiResponse - response object
 * @param {string} testUrl - url of requested server
 * @param {number} testStatus - expected response status code
 * @param {string} testHost - host header value of requested server
 * @param {string} testMethod - request method
 * @param {Object} testHeaders - requeset headers
 * @param {Object} testBody - request body
 */
export const verifyApiResponse = async (apiResponse, testUrl, testStatus, testHost, testMethod, testHeaders, testBody = null) => {
    const apiResponseDataRequest = apiResponse.data.request;

    // * Verify request url and response status
    jestExpect(testUrl).toContain(apiResponseDataRequest.url);
    jestExpect(apiResponse.status).toEqual(testStatus);

    // * Verify response headers contain server header
    jestExpect(apiResponse.headers['server']).toBe('mock-server');

    // * Verify response body contains request host and request method
    jestExpect(apiResponseDataRequest.headers['host']).toBe(testHost);
    jestExpect(apiResponseDataRequest.method).toBe(testMethod);

    // * Verify response body contains request headers
    for (const [k, v] of Object.entries(testHeaders)) {
        jestExpect(apiResponseDataRequest.headers[k]).toBe(v);
    }
    
    if (testBody) {
        // * Verify response body contains request body
        jestExpect(Object.keys(apiResponseDataRequest.body)).toHaveLength(Object.keys(testBody).length);
        for (const [k, v] of Object.entries(testBody)) {
            jestExpect(apiResponseDataRequest.body[k]).toBe(v);
        }
    }
};

/**
 * Verify response overlay.
 * @param {string} testUrl - url of requested server
 * @param {number} testStatus - expected response status code
 * @param {string} testHost - host header value of requested server
 * @param {string} testMethod - request method
 * @param {Object} testHeaders - requeset headers
 * @param {Object} testBody - request body
 */
export const verifyResponseOverlay = async (testUrl, testStatus, testHost, testMethod, testHeaders, testBody = null) => {
    const {
        responseCodeText,
        responseDataText,
        responseHeadersText,
        responseLastRequestedUrlText,
    } = GenericClientRequestScreen;
    
    // * Verify request url and response status
    await expect(responseLastRequestedUrlText).toHaveText(testUrl);
    await expect(responseCodeText).toHaveText(testStatus.toString());

    // Currently only for iOS. Android getAttributes support is not yet available.
    // https://github.com/wix/Detox/issues/2083
    if (isIos()) {
        // * Verify response headers contain server header
        const responseHeadersTextAttributes = await responseHeadersText.getAttributes();
        const responseHeaders = JSON.parse(responseHeadersTextAttributes.text);
        jestExpect(responseHeaders['Server']).toBe('mock-server');

        // * Verify response body contains request host and request method
        const responseDataTextAttributes = await responseDataText.getAttributes();
        const responseDataRequest = JSON.parse(responseDataTextAttributes.text).request;
        jestExpect(responseDataRequest.headers['host']).toBe(testHost);
        jestExpect(responseDataRequest.method).toBe(testMethod);

        // * Verify response body contains request headers
        for (const [k, v] of Object.entries(testHeaders)) {
            jestExpect(responseDataRequest.headers[k]).toBe(v);
        }

        if (testBody) {
            // * Verify response body contains request body
            jestExpect(Object.keys(responseDataRequest.body)).toHaveLength(Object.keys(testBody).length);
            for (const [k, v] of Object.entries(testBody)) {
                jestExpect(responseDataRequest.body[k]).toBe(v);
            }
        }
    }
};
