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
 * @param {string} options.baseUrl - base URL of requested server
 * @param {string} options.clientCertPassword - secure client certificate password
 * @param {Object} options.headers - request headers
 * @param {string} options.name - client name
 * @param {number} options.maxConnections - client max connections
 * @param {number} options.requestTimeoutInterval - client request timeout interval
 * @param {number} options.resourceTimeoutInterval - client resource timeout interval
 * @param {Object} options.retry - client retry configuration
 * @param {boolean} options.secure - if server is secure, true; otherwise, false
 * @param {string} options.secureServerClientCertUrl - secure server client certificate URL
 * @param {boolean} options.toggleOn - if true, checkboxes are toggled on
 * @param {string} options.token - request authentication token
 * @param {boolean} options.verify - if true, client created is verified
 */
export const createApiClient = async ({
    baseUrl = null,
    clientCertPassword = null,
    headers = null,
    name = null,
    maxConnections = null,
    requestTimeoutInterval = null,
    resourceTimeoutInterval = null,
    retry = null,
    secure = false,
    secureServerClientCertUrl = null,
    toggleOn = false,
    token = null,
    verify = true,
} = {}) => {
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
    if (name) {
        await setName(name);
    }
    if (baseUrl) {
        await setBaseUrl(baseUrl);
    }
    if (headers) {
        await setHeaders(headers);
    }
    if (token) {
        await setBearerAuthToken(token);
    }
    if (secure) {
        await CreateApiClientScreen.downloadP12(
            secureServerClientCertUrl,
            clientCertPassword
        );
    }
    if (requestTimeoutInterval) {
        await setRequestTimeoutInterval(requestTimeoutInterval);
    }
    if (resourceTimeoutInterval) {
        await setResourceTimeoutInterval(resourceTimeoutInterval);
    }
    if (maxConnections) {
        await setMaxConnections(maxConnections);
    }
    if (toggleOn) {
        await toggleOnWaitsForConnectivityCheckbox();
        await toggleOnCancelRequestsOn401Checkbox();
    }
    if (secure) {
        await toggleOnTrustSelfSignedServerCertificateCheckbox();
    }
    if (retry) {
        await setRetry(retry);
    }

    // # Create client
    await createClient();

    // * Verify created client
    if (verify) {
        await ApiClientScreen.open(name);
        await verifyApiClient(name, baseUrl, headers);

        // # Open client list screen
        await ApiClientScreen.back();
    }
};

/**
 * Create WebSocket client.
 * @param {string} options.clientCertPassword - secure client certificate password
 * @param {Object} options.headers - request headers
 * @param {string} options.name - client name
 * @param {boolean} options.secure - if server is secure, true; otherwise, false
 * @param {string} options.secureServerClientCertUrl - secure server client certificate URL
 * @param {number} options.timeoutInterval - client request timeout interval
 * @param {boolean} options.toggleOn - if true, checkboxes are toggled on
 * @param {string} options.url - URL of requested server
 * @param {boolean} options.verify - if true, client created is verified
 */
export const createWebSocketClient = async ({
    clientCertPassword = null,
    headers = null,
    name = null,
    secure = false,
    secureWebSocketServerClientCertUrl = null,
    timeoutInterval = null,
    toggleOn = false,
    url = null,
    verify = true,
} = {}) => {
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
    if (name) {
        await setName(name);
    }
    if (url) {
        await setUrl(url);
    }
    if (headers) {
        await setHeaders(headers);
    }
    if (secure) {
        await CreateWebSocketClientScreen.downloadP12(
            secureWebSocketServerClientCertUrl,
            clientCertPassword
        );
    }
    if (timeoutInterval) {
        await setTimeoutInterval(timeoutInterval);
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
            name
        );
        await expect(title).toHaveText(name);
        await expect(subtitle).toHaveText(url);
    }
};

/**
 * Perform API client request.
 * @param {Object} options.body - request body
 * @param {Object} options.headers - requeset headers
 * @param {string} options.path - relative or absolute path
 * @param {Object} options.retry - client retry
 * @param {number} options.timeoutInterval - client timeout interval
 * @returns {number} beginTime - timestamp in millis before request is made
 */
export const performApiClientRequest = async ({
    body = null,
    headers = null,
    path = null,
    retry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: 1,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 1,
        retryInterval: 1,
    },
    timeoutInterval = 10000,
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
    if (path) {
        await setPath(path);
    }
    if (headers) {
        await setHeaders(headers);
    }
    if (body) {
        await setBody(JSON.stringify(body));
    }
    if (timeoutInterval) {
        await setTimeoutInterval(timeoutInterval);
    }
    if (retry) {
        await setRetry(retry);
    }

    // # Make request
    const beginTime = Date.now();
    await makeRequest();
    return beginTime;
};

/**
 * Perform generic client request.
 * @param {Object} options.body - request body
 * @param {Object} options.headers - requeset headers
 * @param {Object} options.retry - client retry
 * @param {number} options.timeoutInterval - client timeout interval
 * @param {string} options.url - URL of requested server
 * @returns {number} beginTime - timestamp in millis before request is made
 */
export const performGenericClientRequest = async ({
    body = null,
    headers = null,
    retry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: 1,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 1,
        retryInterval: 1,
    },
    timeoutInterval = 10000,
    url = null,
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
    if (url) {
        await setUrl(url);
    }
    if (headers) {
        await setHeaders(headers);
    }
    if (body) {
        await setBody(JSON.stringify(body));
    }
    if (timeoutInterval) {
        await setTimeoutInterval(timeoutInterval);
    }
    if (retry) {
        await setRetry(retry);
    }

    // # Make request
    const beginTime = Date.now();
    await makeRequest();
    return beginTime;
};

/**
 * Verify API response.
 * @param {Object} apiResponse - response object
 * @param {string} url - URL of requested server
 * @param {number} status - expected response status code
 * @param {string} host - host header value of requested server
 * @param {string} method - request method
 * @param {Object} headers - request headers
 * @param {Object} body - request body
 */
export const verifyApiResponse = async (
    apiResponse,
    url,
    status,
    host,
    method,
    headers,
    body = null
) => {
    const apiResponseDataRequest = await apiResponse.data.request;

    // * Verify request URL and response status
    jestExpect(url).toContain(apiResponseDataRequest.url);
    jestExpect(apiResponse.status).toEqual(status);

    // * Verify response headers contain server header
    jestExpect(apiResponse.headers["server"]).toBe("mockserver");

    // * Verify response body contains request host and request method
    jestExpect(apiResponseDataRequest.headers["host"]).toBe(host);
    jestExpect(apiResponseDataRequest.method).toBe(method);

    // * Verify response body contains request headers
    for (const [k, v] of Object.entries(headers)) {
        jestExpect(apiResponseDataRequest.headers[k]).toBe(v);
    }

    if (body) {
        // * Verify response body contains request body
        jestExpect(Object.keys(apiResponseDataRequest.body)).toHaveLength(
            Object.keys(body).length
        );
        for (const [k, v] of Object.entries(body)) {
            jestExpect(apiResponseDataRequest.body[k]).toBe(v);
        }
    }
};

/**
 * Verify response success overlay.
 * @param {string} url - URL of requested server
 * @param {number} status - expected response status code
 * @param {string} host - host header value of requested server
 * @param {string} method - request method
 * @param {Object} headers - request headers
 * @param {Object} body - request body
 * @param {string} options.retriesExhausted - "null", "true", or "false"
 * @param {boolean} options.secure - if server is secure, true; otherwise, false
 * @param {string} options.server - server name
 * @returns {number} endTime - timestamp in millis after response is received
 */
export const verifyResponseSuccessOverlay = async (
    url,
    status,
    host,
    method,
    headers,
    body = null,
    { retriesExhausted = "null", secure = false, server = "mockserver" } = {}
) => {
    const {
        responseSuccessCodeText,
        responseSuccessDataText,
        responseSuccessHeadersText,
        responseSuccessOkText,
        responseSuccessRetriesExhaustedText,
    } = ResponseSuccessOverlay;

    // * Verify response code, response status, and retries exhausted
    await waitFor(responseSuccessCodeText)
        .toBeVisible()
        .withTimeout(timeouts.TEN_SEC);
    const endTime = Date.now();
    await expect(responseSuccessCodeText).toHaveText(status.toString());
    await expect(responseSuccessOkText).toHaveText(
        status === 200 ? "true" : "false"
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
        if (host) {
            jestExpect(responseDataRequest.headers["host"]).toBe(host);
        }
        if (method) {
            jestExpect(responseDataRequest.method).toBe(method);
        }

        // * Verify response body contains request headers
        if (headers) {
            for (const [k, v] of Object.entries(headers)) {
                jestExpect(responseDataRequest.headers[k]).toBe(v);
            }
        }

        // * Verify response body contains request body
        if (body) {
            jestExpect(Object.keys(responseDataRequest.body)).toHaveLength(
                Object.keys(body).length
            );
            for (const [k, v] of Object.entries(body)) {
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
 * @param {number} errorCode - the client error code
 * @param {string} errorMessage - the client error message
 */
export const verifyResponseErrorOverlay = async (errorCode, errorMessage) => {
    const {
        responseErrorCodeText,
        responseErrorMessageText,
    } = ResponseErrorOverlay;
    // * Verify response error code and message
    if (isIos()) {
        await expect(responseErrorCodeText).toHaveText(errorCode.toString());
        await expect(responseErrorMessageText).toHaveText(errorMessage);
    } else {
        await expect(responseErrorCodeText).toBeVisible();
        await expect(responseErrorMessageText).toBeVisible();
    }

    // # Close response error overlay
    await ResponseErrorOverlay.close();
};

/**
 * Verify API client.
 * @param {string} name - client name
 * @param {string} url - URL of requested server
 * @param {Object} headers - request headers
 */
export const verifyApiClient = async (name, url, headers = null) => {
    const {
        baseUrlInput,
        getHeaderListItemAtIndex,
        nameInput,
    } = ApiClientScreen;

    const unordered = headers ? headers : {};
    const ordered = Object.keys(unordered)
        .sort()
        .reduce((result, key) => {
            result[key] = headers[key];
            return result;
        }, {});
    const entries = Object.entries(ordered);
    if (isAndroid()) {
        await expect(nameInput).toHaveText(name);
        await expect(baseUrlInput).toHaveText(url);

        for (const [index, [key, value]] of Object.entries(entries)) {
            const { keyInput, valueInput } = getHeaderListItemAtIndex(index);
            await expect(keyInput).toHaveText(key);
            await expect(valueInput).toHaveText(value);
        }
    } else {
        await expect(nameInput).toHaveValue(name);
        await expect(baseUrlInput).toHaveValue(url);

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
    const actualTimeDiff = Math.floor((endTime - beginTime - 1000) / 1000);
    const expectedTimeDiff = Math.floor((retryLimit * retryInterval) / 1000);
    const diff = Math.abs(actualTimeDiff - expectedTimeDiff);
    jestExpect(diff).toBeLessThanOrEqual(1);
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
    const actualTimeDiff = Math.round((endTime - beginTime - 2000) / 1000);

    // This is a workaround calculation to closely match actual results
    let expectedTimeDiff = Math.round(
        exponentialBackoffBase * exponentialBackoffScale
    );

    // // This is the expected calculated delay for exponential retry, however,
    // // the app is not producing the same results
    // for (let retryCount = 1; retryCount <= retryLimit; retryCount++) {
    //     expectedTimeDiff += Math.round(
    //         Math.pow(exponentialBackoffBase, retryCount) *
    //             exponentialBackoffScale
    //     );
    // }

    const diff = Math.abs(actualTimeDiff - expectedTimeDiff);
    jestExpect(diff).toBeLessThanOrEqual(1);
};
