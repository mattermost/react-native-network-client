// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestExpect from "expect";

import {
    ResponseErrorOverlay,
    ResponseSuccessOverlay,
} from "@support/ui/component";
import {
    ApiClientRequestScreen,
    ApiClientScreen,
    ClientListScreen,
    CreateApiClientScreen,
    CreateWebSocketClientScreen,
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
 * Create API client.
 * @param {string} testName - client name
 * @param {string} testBaseUrl - base URL of requested server
 * @param {Object} testHeaders - request headers
 * @param {string} testToken - request authentication token
 * @param {number} testRequestTimeoutInterval - client request timeout interval
 * @param {number} testResourceTimeoutInterval - client resource timeout interval
 * @param {number} testMaxConnections - client max connections
 * @param {Object} testRetry - client retry configuration
 * @param {string} options.clientCertPassword - secure client certificate password
 * @param {boolean} options.secure - if server is secure, true; otherwise, false
 * @param {string} options.secureServerClientCertUrl - secure server client certificate URL
 * @param {boolean} options.toggleOn - if true, checkboxes are toggled on
 * @param {boolean} options.verify - if true, client created is verified
 */
export const createApiClient = async (
    testName,
    testBaseUrl,
    testHeaders = null,
    testToken = null,
    testRequestTimeoutInterval = null,
    testResourceTimeoutInterval = null,
    testMaxConnections = null,
    testRetry = null,
    {
        clientCertPassword = null,
        secure = false,
        secureServerClientCertUrl = null,
        toggleOn = false,
        verify = true,
    } = {}
) => {
    const {
        createClient,
        setBaseUrl,
        setBearerAuthToken,
        setHeaders,
        setMaxConnections,
        setName,
        setRequestTimeoutInterval,
        setResourceTimeoutInterval,
        setRetry,
        toggleOnCancelRequestsOn401Checkbox,
        toggleOnTrustSelfSignedServerCertificateCheckbox,
        toggleOnWaitsForConnectivityCheckbox,
    } = CreateApiClientScreen;

    // # Open create API client screen
    await CreateApiClientScreen.open();

    // # Set all fields
    await setName(testName);
    await setBaseUrl(testBaseUrl);
    if (testHeaders) {
        await setHeaders(testHeaders);
    }
    if (testToken) {
        await setBearerAuthToken(testToken);
    }
    if (secure) {
        await CreateApiClientScreen.downloadP12(
            secureServerClientCertUrl,
            clientCertPassword
        );
    }
    if (testRequestTimeoutInterval) {
        await setRequestTimeoutInterval(testRequestTimeoutInterval);
    }
    if (testResourceTimeoutInterval) {
        await setResourceTimeoutInterval(testResourceTimeoutInterval);
    }
    if (testMaxConnections) {
        await setMaxConnections(testMaxConnections);
    }
    if (toggleOn) {
        await toggleOnWaitsForConnectivityCheckbox();
        await toggleOnCancelRequestsOn401Checkbox();
    }
    if (secure) {
        await toggleOnTrustSelfSignedServerCertificateCheckbox();
    }
    if (testRetry) {
        await setRetry(testRetry);
    }

    // # Create client
    await createClient();

    // * Verify created client
    if (verify) {
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, testHeaders);

        // # Open client list screen
        await ApiClientScreen.back();
    }
};

/**
 * Create WebSocket client.
 * @param {string} testName - client name
 * @param {string} testUrl - URL of requested server
 * @param {Object} testHeaders - request headers
 * @param {number} testTimeoutInterval - client request timeout interval
 * @param {string} options.clientCertPassword - secure client certificate password
 * @param {boolean} options.secure - if server is secure, true; otherwise, false
 * @param {string} options.secureServerClientCertUrl - secure server client certificate URL
 * @param {boolean} options.toggleOn - if true, checkboxes are toggled on
 * @param {boolean} options.verify - if true, client created is verified
 */
export const createWebSocketClient = async (
    testName,
    testUrl,
    testHeaders = null,
    testTimeoutInterval = null,
    {
        clientCertPassword = null,
        secure = false,
        secureWebSocketServerClientCertUrl = null,
        toggleOn = false,
        verify = true,
    } = {}
) => {
    const {
        createClient,
        setHeaders,
        setName,
        setTimeoutInterval,
        setUrl,
        toggleOnEnableCompressionCheckbox,
        toggleOnTrustSelfSignedServerCertificateCheckbox,
    } = CreateWebSocketClientScreen;

    // # Open create WebSocket client screen
    await CreateWebSocketClientScreen.open();

    // # Set all fields
    await setName(testName);
    await setUrl(testUrl);
    if (testHeaders) {
        await setHeaders(testHeaders);
    }
    if (secure) {
        await CreateWebSocketClientScreen.downloadP12(
            secureWebSocketServerClientCertUrl,
            clientCertPassword
        );
    }
    if (testTimeoutInterval) {
        await setTimeoutInterval(testTimeoutInterval);
    }
    if (toggleOn) {
        await toggleOnEnableCompressionCheckbox();
    }
    if (secure) {
        await toggleOnTrustSelfSignedServerCertificateCheckbox();
    }

    // Create client
    await createClient();

    // * Verify created client
    if (verify) {
        const { subtitle, title } = await ClientListScreen.getClientByName(
            testName
        );
        await expect(title).toHaveText(testName);
        await expect(subtitle).toHaveText(testUrl);
    }
};

/**
 * Perform API client request.
 * @param {string} options.testPath - relative or absolute path
 * @param {Object} options.testHeaders - requeset headers
 * @param {Object} options.testBody - request body
 * @param {number} options.testTimeoutInterval - client timeout interval
 * @param {Object} options.testRetry - client retry
 * @returns {number} beginTime - timestamp in millis before request is made
 */
export const performApiClientRequest = async ({
    testPath,
    testHeaders = null,
    testBody = null,
    testTimeoutInterval = 60,
    testRetry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: 3,
        exponentialBackoffBase: 4,
        exponentialBackoffScale: 5,
        retryInterval: 6,
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

    // # Set all fields
    await setPath(testPath);
    if (testHeaders) {
        await setHeaders(testHeaders);
    }
    if (testBody) {
        await setBody(JSON.stringify(testBody));
    }
    if (testTimeoutInterval) {
        await setTimeoutInterval(testTimeoutInterval);
    }
    if (testRetry) {
        await setRetry(testRetry);
    }

    // # Make request
    const beginTime = Date.now();
    await makeRequest();
    return beginTime;
};

/**
 * Perform generic client request.
 * @param {string} options.testUrl - URL of requested server
 * @param {Object} options.testHeaders - requeset headers
 * @param {Object} options.testBody - request body
 * @param {number} options.testTimeoutInterval - client timeout interval
 * @param {Object} options.testRetry - client retry
 * @returns {number} beginTime - timestamp in millis before request is made
 */
export const performGenericClientRequest = async ({
    testUrl,
    testHeaders = null,
    testBody = null,
    testTimeoutInterval = 60,
    testRetry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: 3,
        exponentialBackoffBase: 4,
        exponentialBackoffScale: 5,
        retryInterval: 6,
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

    // # Set all fields
    await setUrl(testUrl);
    if (testHeaders) {
        await setHeaders(testHeaders);
    }
    if (testBody) {
        await setBody(JSON.stringify(testBody));
    }
    if (testTimeoutInterval) {
        await setTimeoutInterval(testTimeoutInterval);
    }
    if (testRetry) {
        await setRetry(testRetry);
    }

    // # Make request
    const beginTime = Date.now();
    await makeRequest();
    return beginTime;
};

/**
 * Verify API response.
 * @param {Object} apiResponse - response object
 * @param {string} testUrl - URL of requested server
 * @param {number} testStatus - expected response status code
 * @param {string} testHost - host header value of requested server
 * @param {string} testMethod - request method
 * @param {Object} testHeaders - request headers
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
 * @param {Object} testHeaders - request headers
 * @param {Object} testBody - request body
 * @param {string} options.retriesExhausted - "null", "true", or "false"
 * @param {boolean} options.secure - if server is secure, true; otherwise, false
 * @param {string} options.server - server name
 * @returns {number} endTime - timestamp in millis after response is received
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

    // * Verify request URL, response code, response status, and retries exhausted
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

    // # Close response success overlay
    await ResponseSuccessOverlay.close();

    return endTime;
};

/**
 * Verify response error overlay.
 * @param {number} testErrorCode - the client error code
 * @param {string} testErrorMessage - the client error message
 */
export const verifyResponseErrorOverlay = async (
    testErrorCode,
    testErrorMessage
) => {
    const {
        responseErrorCodeText,
        responseErrorMessageText,
    } = ResponseErrorOverlay;

    // * Verify response error code and message
    await expect(responseErrorCodeText).toHaveText(testErrorCode.toString());
    await expect(responseErrorMessageText).toHaveText(testErrorMessage);

    // # Close response error overlay
    await ResponseErrorOverlay.close();
};

/**
 * Verify API client.
 * @param {string} testName - client name
 * @param {string} testUrl - URL of requested server
 * @param {Object} testHeaders - request headers
 */
export const verifyApiClient = async (
    testName,
    testUrl,
    testHeaders = null
) => {
    const {
        baseUrlInput,
        getHeaderListItemAtIndex,
        nameInput,
    } = ApiClientScreen;

    const headers = testHeaders ? testHeaders : {};
    const ordered = Object.keys(headers)
        .sort()
        .reduce((result, key) => {
            result[key] = headers[key];
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

/**
 * Verify WebSocket event.
 * @param {Object} eventJson - event as JSON object
 */
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

/**
 * Verify linear retry time difference.
 * @param {number} beginTime - the begin time in millis
 * @param {number} endTime - the end time in millis
 * @param {number} retryLimit - the retry limit
 * @param {number} retryInterval - the retry interval in millis
 */
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

/**
 * Verify exponential retry time difference.
 * @param {number} beginTime - the begin time in millis
 * @param {number} endTime - the end time in millis
 * @param {number} retryLimit - the retry limit
 * @param {number} exponentialBackoffBase - the exponential backoff base in seconds
 * @param {number} exponentialBackoffScale - the exponential backoff scale
 */
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
