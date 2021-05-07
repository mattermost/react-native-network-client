// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { Request } from "@support/server_api";
import {
    clientCertPassword,
    secureServerClientCertUrl,
    secureServerUrl,
    secureSiteUrl,
    serverUrl,
    siteUrl,
} from "@support/test_config";
import {
    ApiClientImportP12Screen,
    ApiClientRequestScreen,
    ApiClientScreen,
} from "@support/ui/screen";
import { getHost, getRandomId, isAndroid } from "@support/utils";
import {
    customBody,
    customHeaders,
    newHeaders,
    performApiClientRequest,
    verifyApiClient,
    verifyApiResponse,
    verifyExponentialRetryTimeDiff,
    verifyLinearRetryTimeDiff,
    verifyResponseSuccessOverlay,
} from "../helpers";

describe("Delete - API Client Request", () => {
    const testMethod = "DELETE";
    const testPath = `/${testMethod.toLowerCase()}`;
    const testBaseUrl = serverUrl;
    const testServerUrl = `${testBaseUrl}${testPath}`;
    const testSiteUrl = `${siteUrl}${testPath}`;
    const testHost = getHost(siteUrl);
    const testName = "Mockserver API";
    const testSecureBaseUrl = secureServerUrl;
    const testSecureServerUrl = `${testSecureBaseUrl}${testPath}`;
    const testSecureSiteUrl = `${secureSiteUrl}${testPath}`;
    const testSecureHost = getHost(secureSiteUrl);
    const testSecureName = "Secure Mockserver API";
    const testStatus = 200;
    const testHeaders = { ...newHeaders };
    const testBody = { ...customBody };
    const combinedHeaders = {
        ...customHeaders,
        ...newHeaders,
    };

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should return a valid response", async () => {
        // * Verify direct server response
        const apiResponse = await Request.apiDelete({
            headers: testHeaders,
            body: testBody,
            secure: false,
        });
        await verifyApiResponse(
            apiResponse,
            testSiteUrl,
            testStatus,
            testHost,
            testMethod,
            testHeaders,
            testBody
        );

        // # Select delete
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectDelete();

        // # Perform API client request
        await performApiClientRequest({
            body: testBody,
            headers: testHeaders,
            path: testPath,
        });

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testServerUrl,
            testStatus,
            testHost,
            testMethod,
            combinedHeaders,
            testBody,
            { secure: false }
        );
    });

    it("should return a valid response - secure connection", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // * Verify direct server response
        const apiResponse = await Request.apiDelete({
            headers: testHeaders,
            body: testBody,
            secure: true,
        });
        await verifyApiResponse(
            apiResponse,
            testSecureSiteUrl,
            testStatus,
            testSecureHost,
            testMethod,
            testHeaders,
            testBody
        );

        // # Import p12 and select delete
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl, customHeaders);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(
            secureServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectDelete();

        // # Perform API client request
        await performApiClientRequest({
            body: testBody,
            headers: testHeaders,
            path: testPath,
        });

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testSecureServerUrl,
            testStatus,
            testSecureHost,
            testMethod,
            combinedHeaders,
            testBody,
            { secure: true }
        );
    });

    it("should be able to linear retry", async () => {
        // # Select delete
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectDelete();

        // # Perform API client request
        const retryLimit = 2;
        const retryInterval = 2000;
        const testRetry = {
            retryPolicyType: "linear",
            retryLimit: retryLimit.toString(),
            retryInterval: retryInterval.toString(),
        };
        const clientID = getRandomId();
        const testRetryPath = `${testPath}/retry/clientID/${clientID}/serverDelay/0/serverRetryLimit/5`;
        const beginTime = await performApiClientRequest({
            body: testBody,
            headers: testHeaders,
            path: testRetryPath,
            retry: testRetry,
        });

        // * Verify retry response
        const testRetryStatus = 408;
        const testRetryUrl = `${testBaseUrl}${testRetryPath}`;
        const endTime = await verifyResponseSuccessOverlay(
            testRetryUrl,
            testRetryStatus,
            null,
            null,
            null,
            null,
            { retriesExhausted: "true" }
        );

        // * Verify retry time difference
        verifyLinearRetryTimeDiff(
            beginTime,
            endTime,
            retryLimit,
            retryInterval
        );

        // # Make another request
        await ApiClientRequestScreen.makeRequest();

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testRetryUrl,
            testStatus,
            testHost,
            testMethod,
            combinedHeaders,
            testBody
        );
    });

    it("should be able to exponential retry", async () => {
        // # Select delete
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectDelete();

        // # Perform API client request
        const retryLimit = 2;
        const exponentialBackoffBase = 2;
        const exponentialBackoffScale = 0.5;
        const testRetry = {
            retryPolicyType: "exponential",
            retryLimit: retryLimit.toString(),
            exponentialBackoffBase: exponentialBackoffBase.toString(),
            exponentialBackoffScale: exponentialBackoffScale.toString(),
        };
        const clientID = getRandomId();
        const testRetryPath = `${testPath}/retry/clientID/${clientID}/serverDelay/0/serverRetryLimit/5`;
        const beginTime = await performApiClientRequest({
            body: testBody,
            headers: testHeaders,
            path: testRetryPath,
            retry: testRetry,
        });

        // * Verify retry response
        const testRetryStatus = 408;
        const testRetryUrl = `${testBaseUrl}${testRetryPath}`;
        const endTime = await verifyResponseSuccessOverlay(
            testRetryUrl,
            testRetryStatus,
            null,
            null,
            null,
            null,
            { retriesExhausted: "true" }
        );

        // * Verify retry time difference
        verifyExponentialRetryTimeDiff(
            beginTime,
            endTime,
            retryLimit,
            exponentialBackoffBase,
            exponentialBackoffScale
        );

        // # Make another request
        await ApiClientRequestScreen.makeRequest();

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testRetryUrl,
            testStatus,
            testHost,
            testMethod,
            combinedHeaders,
            testBody
        );
    });
});
