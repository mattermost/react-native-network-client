// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { Request } from "@support/server_api";
import { siteUrl, serverUrl } from "@support/test_config";
import { GenericClientRequestScreen } from "@support/ui/screen";
import { getHost } from "@support/utils";
import {
    customHeaders,
    performGenericClientRequest,
    verifyApiResponse,
    verifyResponseSuccessOverlay,
} from "../helpers";

describe("Get - Generic Client Request", () => {
    const testMethod = "GET";
    const testServerUrl = `${serverUrl}/${testMethod.toLowerCase()}`;
    const testSiteUrl = `${siteUrl}/${testMethod.toLowerCase()}`;
    const testHost = getHost(siteUrl);
    const testStatus = 200;
    const testHeaders = { ...customHeaders };

    beforeAll(async () => {
        const apiResponse = await Request.apiGet({ headers: testHeaders });
        verifyApiResponse(
            apiResponse,
            testSiteUrl,
            testStatus,
            testHost,
            testMethod,
            testHeaders
        );

        await GenericClientRequestScreen.open();
        await GenericClientRequestScreen.getButton.tap();
    });

    it("should return a valid response", async () => {
        // # Perform generic client request
        await performGenericClientRequest({
            testUrl: testServerUrl,
            testHeaders,
        });

        // * Verify response success overlay
        await verifyResponseSuccessOverlay(
            testServerUrl,
            testStatus,
            testHost,
            testMethod,
            testHeaders
        );
    });
});
