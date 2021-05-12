// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { GenericClientRequestScreen } from "@support/ui/screen";
import { isAndroid } from "@support/utils";
import {
    performGenericClientRequest,
    verifyResponseErrorOverlay,
} from "../helpers";

describe("Error - Generic Client Request", () => {
    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should return an error response when server is unreachable", async () => {
        // # Do not run against Android due to difference in error response
        if (isAndroid()) {
            return;
        }
        
        // # Select method
        await GenericClientRequestScreen.open();
        await GenericClientRequestScreen.getButton.tap();

        // # Perform generic client request
        const testUrl = process.env.IOS
            ? "http://127.0.0.1"
            : "http://10.0.2.2";
        await performGenericClientRequest({
            retry: null,
            timeoutInterval: null,
            url: testUrl,
        });

        // * Verify response error overlay
        await verifyResponseErrorOverlay(
            13,
            "URLSessionTask failed with error: Could not connect to the server."
        );
    });
});
