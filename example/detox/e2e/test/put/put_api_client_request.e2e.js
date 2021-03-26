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
    secureServerUrl,
    secureSiteUrl,
    serverUrl,
    siteUrl,
} from "@support/test_config";
import { ApiClientImportP12Screen, ApiClientScreen } from "@support/ui/screen";
import { getHost } from "@support/utils";
import {
    customBody,
    customHeaders,
    newHeaders,
    performApiClientRequest,
    verifyApiClient,
    verifyApiResponse,
    verifyResponseSuccessOverlay,
} from "../helpers";

describe("Put - API Client Request", () => {
    const testMethod = "PUT";
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
        const apiResponse = await Request.apiPut({
            headers: testHeaders,
            body: testBody,
            secure: false,
        });
        verifyApiResponse(
            apiResponse,
            testSiteUrl,
            testStatus,
            testHost,
            testMethod,
            testHeaders,
            testBody
        );

        // # Select put
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectPut();

        // # Perform API client request
        await performApiClientRequest({ testPath, testHeaders, testBody });

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
        // * Verify direct server response
        const apiResponse = await Request.apiPut({
            headers: testHeaders,
            body: testBody,
            secure: true,
        });
        verifyApiResponse(
            apiResponse,
            testSecureSiteUrl,
            testStatus,
            testSecureHost,
            testMethod,
            testHeaders,
            testBody
        );

        // # Import p12 and select put
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl, customHeaders);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(clientCertPassword);
        await ApiClientScreen.selectPut();

        // # Perform API client request
        await performApiClientRequest({ testPath, testHeaders, testBody });

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
});
