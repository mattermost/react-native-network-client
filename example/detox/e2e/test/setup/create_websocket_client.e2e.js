// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    clientCertPassword,
    secureWebSocketServerClientCertUrl,
    secureWebSocketServerUrl,
} from "@support/test_config";
import { Alert } from "@support/ui/component";
import {
    ClientListScreen,
    CreateWebSocketClientScreen,
} from "@support/ui/screen";
import { getRandomId, getRandomInt, isAndroid } from "@support/utils";
import { createWebSocketClient, customHeaders } from "../helpers";

describe("Create WebSocket Client", () => {
    const randomText = getRandomId(10);
    const testUrl = `wss://example-${randomText}-ws.com`;
    const testName = `Example ${randomText} WebSocket`;
    const testHeaders = { ...customHeaders };
    const testTimeoutInterval = getRandomInt(60) * 1000;

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to create, alert for duplicate, and remove a WebSocket client", async () => {
        // # Create WebSocket client
        await createWebSocketClient({
            headers: testHeaders,
            name: testName,
            secure: false,
            timeoutInterval: testTimeoutInterval,
            url: testUrl,
        });

        // # Alert for duplicate WebSocket client
        await alertForDuplicateWebSocketClient(testName, testUrl);

        // # Remove WebSocket client
        await removeWebSocketClient(testName);
    });

    it("should be able to create, alert for duplicate, and remove a WebSocket client - secure connection", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Create WebSocket client
        const testSecureName = `Secure ${testName}`;
        const testSecureUrl = secureWebSocketServerUrl;
        await createWebSocketClient({
            clientCertPassword,
            headers: testHeaders,
            name: testSecureName,
            secure: true,
            secureWebSocketServerClientCertUrl,
            timeoutInterval: testTimeoutInterval,
            url: testSecureUrl,
        });

        // # Alert for duplicate WebSocket client
        await alertForDuplicateWebSocketClient(testSecureName, testSecureUrl);

        // # Remove WebSocket client
        await removeWebSocketClient(testSecureName);
    });
});

async function alertForDuplicateWebSocketClient(testName, testUrl) {
    const { errorTitle, okButton } = Alert;

    // # Set an existing url and attempt to create client
    await createWebSocketClient({
        name: testName,
        url: testUrl,
        verify: false,
    });

    // * Verify error alert
    await expect(errorTitle).toBeVisible();
    await expect(
        element(by.text(`A client for ${testUrl} already exists`))
    ).toBeVisible();
    await okButton.tap();
    await CreateWebSocketClientScreen.toBeVisible();

    // # Open client list screen
    await CreateWebSocketClientScreen.back();
}

async function removeWebSocketClient(testName) {
    // # Remove client
    await ClientListScreen.removeClientByName(testName);

    // * Verify client is removed
    await expect(element(by.text(testName))).not.toBeVisible();
}
