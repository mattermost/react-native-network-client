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
import { getRandomId, getRandomInt } from "@support/utils";
import { customHeaders } from "../helpers";

describe("Create WebSocket Client", () => {
    const randomText = getRandomId(10);
    const testUrl = `wss://example-${randomText}-ws.com`;
    const testName = `Example ${randomText} WebSocket`;
    const testHeaders = { ...customHeaders };
    const testTimeoutInterval = getRandomInt(60).toString();

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to create, alert for duplicate, and remove a WebSocket client", async () => {
        // # Create WebSocket client
        await CreateWebSocketClientScreen.open();
        await createWebSocketClient(
            testName,
            testUrl,
            testHeaders,
            testTimeoutInterval,
            { secure: false }
        );

        // # Alert for duplicate WebSocket client
        await alertForDuplicateWebSocketClient(testName, testUrl);

        // # Remove WebSocket client
        await removeWebSocketClient(testName);
    });

    it("should be able to create, alert for duplicate, and remove a WebSocket client - secure connection", async () => {
        // # Create WebSocket client
        const testSecureName = `Secure ${testName}`;
        const testSecureUrl = secureWebSocketServerUrl;
        await CreateWebSocketClientScreen.open();
        await createWebSocketClient(
            testSecureName,
            testSecureUrl,
            testHeaders,
            testTimeoutInterval,
            { secure: true }
        );

        // # Alert for duplicate WebSocket client
        await alertForDuplicateWebSocketClient(testSecureName, testSecureUrl);

        // # Remove WebSocket client
        await removeWebSocketClient(testSecureName);
    });
});

async function createWebSocketClient(
    testName,
    testUrl,
    testHeaders,
    testTimeoutInterval,
    { secure = false }
) {
    const {
        createClient,
        setHeaders,
        setName,
        setTimeoutInterval,
        setUrl,
        toggleOnEnableCompressionCheckbox,
        toggleOnTrustSelfSignedServerCertificateCheckbox,
    } = CreateWebSocketClientScreen;

    // # Set all fields and create client
    await setName(testName);
    await setUrl(testUrl);
    await setHeaders(testHeaders);
    if (secure) {
        await CreateWebSocketClientScreen.downloadP12(
            secureWebSocketServerClientCertUrl,
            clientCertPassword
        );
    }
    await setTimeoutInterval(testTimeoutInterval);
    await toggleOnEnableCompressionCheckbox();
    await toggleOnTrustSelfSignedServerCertificateCheckbox();
    await createClient();

    // * Verify created client
    const { subtitle, title } = await ClientListScreen.getClientByName(
        testName
    );
    await expect(title).toHaveText(testName);
    await expect(subtitle).toHaveText(testUrl);
}

async function alertForDuplicateWebSocketClient(testName, testUrl) {
    const { createClient, setName, setUrl } = CreateWebSocketClientScreen;
    const { errorTitle, okButton } = Alert;

    // # Open create WebSocket client screen
    await CreateWebSocketClientScreen.open();

    // # Set an existing url and attempt to create client
    await setName(testName);
    await setUrl(testUrl);
    await createClient();

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
