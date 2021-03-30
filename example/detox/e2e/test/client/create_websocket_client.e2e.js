// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { Alert, ClientListItem } from "@support/ui/component";
import {
    ClientListScreen,
    CreateWebSocketClientScreen,
} from "@support/ui/screen";
import { getRandomId, getRandomInt } from "@support/utils";
import { customHeaders } from "../helpers";

describe("Create WebSocket Client", () => {
    const randomText = getRandomId(10);
    const testUrl = `ws://example-${randomText}-ws.com`;
    const testName = `Example ${randomText} WebSocket`;
    const testHeaders = { ...customHeaders };
    const testTimeoutInterval = getRandomInt(60).toString();
    const {
        createClient,
        setHeaders,
        setName,
        setTimeoutInterval,
        setUrl,
        toggleOnEnableCompressionCheckbox,
    } = CreateWebSocketClientScreen;
    const { clientListScrollView, removeClientWithName } = ClientListScreen;

    beforeAll(async () => {
        await CreateWebSocketClientScreen.open();
    });

    it("should be able to create an API client", async () => {
        // # Set all fields and create client
        await setName(testName);
        await setUrl(testUrl);
        await setHeaders(testHeaders);
        await setTimeoutInterval(testTimeoutInterval);
        await toggleOnEnableCompressionCheckbox();
        await createClient();

        // * Verify created client
        await clientListScrollView.scrollTo("bottom");
        const { subtitle, title } = ClientListItem.getItemByName(testName);
        await expect(title).toHaveText(testName);
        await expect(subtitle).toHaveText(testUrl);
    });

    it("should not be able to create an API client with existing URL", async () => {
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
    });

    it("should be able to remove a WebSocket client", async () => {
        // # Remove client
        await clientListScrollView.scrollTo("bottom");
        await removeClientWithName(testName);

        // * Verify client is removed
        await expect(element(by.text(testName))).not.toBeVisible();
    });
});
