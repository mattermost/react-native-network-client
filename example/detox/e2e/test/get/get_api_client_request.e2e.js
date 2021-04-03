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
import { ApiClientImportP12Screen, ApiClientScreen } from "@support/ui/screen";
import { getHost } from "@support/utils";
import {
    customHeaders,
    newHeaders,
    performApiClientRequest,
    verifyApiClient,
    verifyApiResponse,
    verifyResponseSuccessOverlay,
} from "../helpers";

describe("Get - API Client Request", () => {
    const testMethod = "GET";
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
    const combinedHeaders = {
        ...customHeaders,
        ...newHeaders,
    };

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should return a valid response", async () => {
        // * Verify direct server response
        const apiResponse = await Request.apiGet({
            headers: testHeaders,
            secure: false,
        });
        await verifyApiResponse(
            apiResponse,
            testSiteUrl,
            testStatus,
            testHost,
            testMethod,
            testHeaders
        );

        // # Select get
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectGet();

        // # Perform API client request
        await performApiClientRequest({ testPath, testHeaders });

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testServerUrl,
            testStatus,
            testHost,
            testMethod,
            combinedHeaders,
            null,
            { secure: false }
        );
    });

    it("should return a valid response - secure connection", async () => {
        // * Verify direct server response
        const apiResponse = await Request.apiGet({
            headers: testHeaders,
            secure: true,
        });
        await verifyApiResponse(
            apiResponse,
            testSecureSiteUrl,
            testStatus,
            testSecureHost,
            testMethod,
            testHeaders
        );

        // # Import p12 and select get
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl, customHeaders);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(
            secureServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectGet();

        // # Perform API client request
        await performApiClientRequest({ testPath, testHeaders });

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testSecureServerUrl,
            testStatus,
            testSecureHost,
            testMethod,
            combinedHeaders,
            null,
            { secure: true }
        );
    });
});
