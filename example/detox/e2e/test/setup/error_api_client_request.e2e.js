// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { ApiClientScreen } from "@support/ui/screen";
import { getRandomId } from "@support/utils";
import {
    createApiClient,
    performApiClientRequest,
    verifyResponseErrorOverlay,
} from "../helpers";

describe("Error - API Client Request", () => {
    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should return an error response when server is unreachable", async () => {
        // # Create API client and select method
        const testName = `Example ${getRandomId(10)} API`;
        const testBaseUrl = process.env.IOS
            ? "http://127.0.0.1"
            : "http://10.0.2.2";
        await createApiClient({ baseUrl: testBaseUrl, name: testName });
        await ApiClientScreen.open(testName);
        await ApiClientScreen.selectGet();

        // # Perform API client request
        await performApiClientRequest({
            path: "/",
            timeoutInterval: null,
            retry: null,
        });

        // * Verify response error overlay
        await verifyResponseErrorOverlay(
            13,
            "URLSessionTask failed with error: Could not connect to the server."
        );
    });
});
