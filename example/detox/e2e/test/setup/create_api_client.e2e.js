// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    clientCertPassword,
    secureServerClientCertUrl,
    secureServerUrl,
} from "@support/test_config";
import { Alert } from "@support/ui/component";
import { ClientListScreen, CreateApiClientScreen } from "@support/ui/screen";
import { getRandomId, getRandomInt, getRandomItem } from "@support/utils";
import { createApiClient, customHeaders, retryPolicyTypes } from "../helpers";

describe("Create API Client", () => {
    const randomText = getRandomId(10);
    const testBaseUrl = `https://example-${randomText}-api.com`;
    const testName = `Example ${randomText} API`;
    const testHeaders = { ...customHeaders };
    const testToken = getRandomId(10);
    const testRequestTimeoutInterval = getRandomInt(60);
    const testResourceTimeoutInterval = getRandomInt(60);
    const testMaxConnections = getRandomInt(10);
    const testRetry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: getRandomInt(5) + 1,
        exponentialBackoffBase: getRandomInt(5) + 2,
        exponentialBackoffScale: getRandomInt(5) + 3,
        retryInterval: getRandomInt(5) + 4,
    };

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to create, alert for duplicate, and remove an API client", async () => {
        // Create API client
        await createApiClient(
            testName,
            testBaseUrl,
            testHeaders,
            testToken,
            testRequestTimeoutInterval,
            testResourceTimeoutInterval,
            testMaxConnections,
            testRetry,
            { secure: false }
        );

        // Alert for duplicate API client
        await alertForDuplicateApiClient(testName, testBaseUrl);

        // # Remove API client
        await removeApiClient(testName);
    });

    it("should be able to create, alert for duplicate, and remove an API client - secure connection", async () => {
        // # Remove dupe preset
        await removeApiClient("Secure Mockserver API");

        // Create API client
        const testSecureName = `Secure ${testName}`;
        const testSecureBaseUrl = secureServerUrl;
        await createApiClient(
            testSecureName,
            testSecureBaseUrl,
            testHeaders,
            testToken,
            testRequestTimeoutInterval,
            testResourceTimeoutInterval,
            testMaxConnections,
            testRetry,
            { clientCertPassword, secure: true, secureServerClientCertUrl }
        );

        // Alert for duplicate API client
        await alertForDuplicateApiClient(testSecureName, testSecureBaseUrl);

        // # Remove API client
        await removeApiClient(testSecureName);
    });
});

async function alertForDuplicateApiClient(testName, testBaseUrl) {
    const { errorTitle, okButton } = Alert;

    // # Set an existing url and attempt to create client
    await createApiClient(
        testName,
        testBaseUrl,
        null,
        null,
        null,
        null,
        null,
        null,
        { verify: false }
    );

    // * Verify error alert
    await expect(errorTitle).toBeVisible();
    await expect(
        element(by.text(`A client for ${testBaseUrl} already exists`))
    ).toBeVisible();
    await okButton.tap();
    await CreateApiClientScreen.toBeVisible();

    // # Open client list screen
    await CreateApiClientScreen.back();
}

async function removeApiClient(testName) {
    // # Remove client
    await ClientListScreen.removeClientByName(testName);

    // * Verify client is removed
    await expect(element(by.text(testName))).not.toBeVisible();
}
