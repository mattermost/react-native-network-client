// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestExpect from "expect";

import { ResponseSuccessOverlay } from "@support/ui/component";
import {
    ApiClientRequestScreen,
    ApiClientScreen,
    GenericClientRequestScreen,
    WebSocketClientScreen,
} from "@support/ui/screen";
import { getRandomItem, isAndroid, isIos, timeouts } from "@support/utils";

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
    const beginTime = Date.now();
    await makeRequest();

    return beginTime;
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
export const verifyApiResponse = async (
    apiResponse,
    testUrl,
    testStatus,
    testHost,
    testMethod,
    testHeaders,
    testBody = null
) => {
    const apiResponseDataRequest = await apiResponse.data.request;

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
    { retriesExhausted = "null", secure = false, server = "mockserver" } = {}
) => {
    const {
        responseSuccessCodeText,
        responseSuccessDataText,
        responseSuccessHeadersText,
        responseSuccessLastRequestedUrlText,
        responseSuccessOkText,
        responseSuccessRetriesExhaustedText,
    } = ResponseSuccessOverlay;
    // * Verify request URL and response status
    await waitFor(responseSuccessLastRequestedUrlText)
        .toBeVisible()
        .withTimeout(timeouts.TEN_SEC);
    const endTime = Date.now();
    await expect(responseSuccessLastRequestedUrlText).toHaveText(testUrl);
    await expect(responseSuccessCodeText).toHaveText(testStatus.toString());
    await expect(responseSuccessOkText).toHaveText(
        testStatus === 200 ? "true" : "false"
    );
    await expect(responseSuccessRetriesExhaustedText).toHaveText(
        retriesExhausted
    );

    // Currently only for iOS. Android getAttributes support is not yet available.
    // https://github.com/wix/Detox/issues/2083
    if (isIos() && retriesExhausted === "null") {
        // * Verify response headers contain server header
        const responseSuccessHeadersTextAttributes = await responseSuccessHeadersText.getAttributes();
        const responseHeaders = JSON.parse(
            responseSuccessHeadersTextAttributes.text
        );
        jestExpect(responseHeaders["Server"]).toBe(server);

        // * Verify response body contains request host and request method
        const responseSuccessDataTextAttributes = await responseSuccessDataText.getAttributes();
        const responseDataRequest = JSON.parse(
            responseSuccessDataTextAttributes.text
        ).request;
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
            responseSuccessDataTextAttributes.text
        ).certificate;
        if (secure) {
            jestExpect(responseDataCertificate).toBe(
                "Hello Alice, your certificate was issued by localhost!"
            );
        } else {
            jestExpect(responseDataCertificate).toBe("Non-secure request!");
        }
    }

    return endTime;
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

export const verifyLinearRetryTimeDiff = (
    beginTime,
    endTime,
    retryLimit,
    retryInterval
) => {
    const actualTimeDiff = Math.floor((endTime - beginTime) / 1000);
    const expectedTimeDiff = Math.floor((retryLimit * retryInterval) / 1000);
    jestExpect(actualTimeDiff).toBeCloseTo(expectedTimeDiff);
};

export const verifyExponentialRetryTimeDiff = (
    beginTime,
    endTime,
    retryLimit,
    exponentialBackoffBase,
    exponentialBackoffScale
) => {
    const actualTimeDiff = Math.floor((endTime - beginTime) / 1000);
    let expectedTimeDiff = 0;
    if (isIos()) {
        // This is a workaround calculation to closely match actual results in iOS
        expectedTimeDiff = Math.floor(
            exponentialBackoffBase * exponentialBackoffScale
        );
    } else {
        // This is the expected calculated delay for exponential retry, however,
        // the iOS app is not producing the same results
        for (let retryCount = 1; retryCount <= retryLimit; retryCount++) {
            expectedTimeDiff += Math.floor(
                Math.pow(exponentialBackoffBase, retryCount) *
                    exponentialBackoffScale
            );
        }
    }
    jestExpect(actualTimeDiff).toBeCloseTo(expectedTimeDiff);
};
