// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestExpect from "expect";

import {
    ApiClientRequestScreen,
    ApiClientScreen,
    GenericClientRequestScreen,
    WebSocketClientScreen,
} from "@support/ui/screen";
import { getRandomItem, isAndroid, isIos } from "@support/utils";

export const customHeaders = {
    "header-1-key": "header-1-value",
    "header-2-key": "header-2-value",
};
export const newHeaders = {
    "new-header-1-key": "new-header-1-value",
    "new-header-2-key": "new-header-2-value",
};
export const customBody = {
    field1key: "field1value",
    field2key: "field2value",
};
export const retryPolicyTypes = ["exponential", "linear"];

/**
 * Perform API client request.
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
    testTimeoutInterval = "60",
    testRetry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: "3",
        exponentialBackoffBase: "4",
        exponentialBackoffScale: "5",
        retryInterval: "6",
    },
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
 * @param {string} options.testUrl - URL of requested server
 * @param {Object} options.testHeaders - requeset headers
 * @param {Object} options.testBody - request body
 * @param {Object} options.testTimeoutInterval - client timeout interval
 * @param {Object} options.testRetry - client retry
 */
export const performGenericClientRequest = async ({
    testUrl,
    testHeaders,
    testBody = null,
    testTimeoutInterval = "60",
    testRetry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: "3",
        exponentialBackoffBase: "4",
        exponentialBackoffScale: "5",
        retryInterval: "6",
    },
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
 * @param {string} testUrl - URL of requested server
 * @param {number} testStatus - expected response status code
 * @param {string} testHost - host header value of requested server
 * @param {string} testMethod - request method
 * @param {Object} testHeaders - requeset headers
 * @param {Object} testBody - request body
 */
export const verifyApiResponse = (
    apiResponse,
    testUrl,
    testStatus,
    testHost,
    testMethod,
    testHeaders,
    testBody = null
) => {
    const apiResponseDataRequest = apiResponse.data.request;

    // * Verify request URL and response status
    jestExpect(testUrl).toContain(apiResponseDataRequest.url);
    jestExpect(apiResponse.status).toEqual(testStatus);

    // * Verify response headers contain server header
    jestExpect(apiResponse.headers["server"]).toBe("mockserver");

    // * Verify response body contains request host and request method
    jestExpect(apiResponseDataRequest.headers["host"]).toBe(testHost);
    jestExpect(apiResponseDataRequest.method).toBe(testMethod);

    // * Verify response body contains request headers
    for (const [k, v] of Object.entries(testHeaders)) {
        jestExpect(apiResponseDataRequest.headers[k]).toBe(v);
    }

    if (testBody) {
        // * Verify response body contains request body
        jestExpect(Object.keys(apiResponseDataRequest.body)).toHaveLength(
            Object.keys(testBody).length
        );
        for (const [k, v] of Object.entries(testBody)) {
            jestExpect(apiResponseDataRequest.body[k]).toBe(v);
        }
    }
};

/**
 * Verify response success overlay.
 * @param {string} testUrl - URL of requested server
 * @param {number} testStatus - expected response status code
 * @param {string} testHost - host header value of requested server
 * @param {string} testMethod - request method
 * @param {Object} testHeaders - requeset headers
 * @param {Object} testBody - request body
 */
export const verifyResponseSuccessOverlay = async (
    testUrl,
    testStatus,
    testHost,
    testMethod,
    testHeaders,
    testBody = null,
    { secure = false, server = "mockserver" } = {}
) => {
    const {
        responseCodeText,
        responseDataText,
        responseHeadersText,
        responseLastRequestedUrlText,
        responseOkText,
        responseRetriesExhaustedText,
    } = GenericClientRequestScreen;

    // * Verify request URL and response status
    await expect(responseLastRequestedUrlText).toHaveText(testUrl);
    await expect(responseCodeText).toHaveText(testStatus.toString());
    await expect(responseOkText).toHaveText(
        testStatus === 200 ? "true" : "false"
    );
    await expect(responseRetriesExhaustedText).toHaveText("null");

    // Currently only for iOS. Android getAttributes support is not yet available.
    // https://github.com/wix/Detox/issues/2083
    if (isIos()) {
        // * Verify response headers contain server header
        const responseHeadersTextAttributes = await responseHeadersText.getAttributes();
        const responseHeaders = JSON.parse(responseHeadersTextAttributes.text);
        jestExpect(responseHeaders["Server"]).toBe(server);

        // * Verify response body contains request host and request method
        const responseDataTextAttributes = await responseDataText.getAttributes();
        const responseDataRequest = JSON.parse(responseDataTextAttributes.text)
            .request;
        if (testHost) {
            jestExpect(responseDataRequest.headers["host"]).toBe(testHost);
        }
        if (testMethod) {
            jestExpect(responseDataRequest.method).toBe(testMethod);
        }

        // * Verify response body contains request headers
        if (testHeaders) {
            for (const [k, v] of Object.entries(testHeaders)) {
                jestExpect(responseDataRequest.headers[k]).toBe(v);
            }
        }

        // * Verify response body contains request body
        if (testBody) {
            jestExpect(Object.keys(responseDataRequest.body)).toHaveLength(
                Object.keys(testBody).length
            );
            for (const [k, v] of Object.entries(testBody)) {
                jestExpect(responseDataRequest.body[k]).toBe(v);
            }
        }

        // * Verify certificate
        const responseDataCertificate = JSON.parse(
            responseDataTextAttributes.text
        ).certificate;
        if (secure) {
            jestExpect(responseDataCertificate).toBe(
                "Hello Alice, your certificate was issued by localhost!"
            );
        } else {
            jestExpect(responseDataCertificate).toBe("Non-secure request!");
        }
    }
};

export const verifyApiClient = async (testName, testUrl, testHeaders = {}) => {
    const {
        baseUrlInput,
        getHeaderListItemAtIndex,
        nameInput,
    } = ApiClientScreen;

    const ordered = Object.keys(testHeaders)
        .sort()
        .reduce((result, key) => {
            result[key] = testHeaders[key];
            return result;
        }, {});
    const entries = Object.entries(ordered);
    if (isAndroid()) {
        await expect(nameInput).toHaveText(testName);
        await expect(baseUrlInput).toHaveText(testUrl);

        for (const [index, [key, value]] of Object.entries(entries)) {
            const { keyInput, valueInput } = getHeaderListItemAtIndex(index);
            await expect(keyInput).toHaveText(key);
            await expect(valueInput).toHaveText(value);
        }
    } else {
        await expect(nameInput).toHaveValue(testName);
        await expect(baseUrlInput).toHaveValue(testUrl);

        for (const [index, [key, value]] of Object.entries(entries)) {
            const { keyInput, valueInput } = getHeaderListItemAtIndex(index);
            await expect(keyInput).toHaveValue(key);
            await expect(valueInput).toHaveValue(value);
        }
    }
};

export const verifyWebSocketEvent = async (eventJson) => {
    // Currently only for iOS. Android getAttributes support is not yet available.
    // https://github.com/wix/Detox/issues/2083
    if (isIos()) {
        // * Verify WebSocket event
        const eventTextAttributes = await WebSocketClientScreen.eventText.getAttributes();
        jestExpect(JSON.parse(eventTextAttributes.text)).toStrictEqual(
            eventJson
        );
    }
};
