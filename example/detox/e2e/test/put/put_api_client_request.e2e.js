// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { Request } from "@support/server_api";
import { siteUrl, serverUrl } from "@support/test_config";
import { ApiClientScreen } from "@support/ui/screen";
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
    const testStatus = 200;
    const testName = "Mockserver API";
    const testHeaders = { ...newHeaders };
    const testBody = { ...customBody };
    const combinedHeaders = {
        ...customHeaders,
        ...newHeaders,
    };

    beforeAll(async () => {
        const apiResponse = await Request.apiPut({
            headers: testHeaders,
            body: testBody,
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

        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectPut();
    });

    it("should return a valid response", async () => {
        // # Perform API client request
        await performApiClientRequest({ testPath, testHeaders, testBody });

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testServerUrl,
            testStatus,
            testHost,
            testMethod,
            combinedHeaders,
            testBody
        );
    });
});
