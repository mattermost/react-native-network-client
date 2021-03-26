// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { Alert } from "@support/ui/component";
import {
    ApiClientScreen,
    ClientListScreen,
    CreateApiClientScreen,
} from "@support/ui/screen";
import { getRandomId, getRandomInt, getRandomItem } from "@support/utils";
import { customHeaders, retryPolicyTypes, verifyApiClient } from "../helpers";

describe("Create API Client", () => {
    const randomText = getRandomId(10);
    const testBaseUrl = `https://example-${randomText}-api.com`;
    const testName = `Example ${randomText} API`;
    const testHeaders = { ...customHeaders };
    const testToken = getRandomId(10);
    const testRequestTimeoutInterval = getRandomInt(60).toString();
    const testResourceTimeoutInterval = getRandomInt(60).toString();
    const testMaxConnections = getRandomInt(10).toString();
    const testRetry = {
        retryPolicyType: getRandomItem(retryPolicyTypes),
        retryLimit: `${getRandomInt(5) + 1}`,
        exponentialBackoffBase: `${getRandomInt(5) + 2}`,
        exponentialBackoffScale: `${getRandomInt(5) + 3}`,
        retryInterval: `${getRandomInt(5) + 4}`,
    };
    const { clientListScrollView, removeClientWithName } = ClientListScreen;
    const {
        createApiClientScrollView,
        createClient,
        setBaseUrl,
        setBearerAuthToken,
        setHeaders,
        setMaxConnections,
        setName,
        setRequestTimeoutInterval,
        setResourceTimeoutInterval,
        setRetry,
        toggleOnCancelRequestsOn401Checkbox,
        toggleOnWaitsForConnectivityCheckbox,
    } = CreateApiClientScreen;

    beforeAll(async () => {
        await CreateApiClientScreen.open();
    });

    it("should be able to create an API client", async () => {
        // # Set all fields and create client
        await setName(testName);
        await setBaseUrl(testBaseUrl);
        await setHeaders(testHeaders);
        await setBearerAuthToken(testToken);
        await setRequestTimeoutInterval(testRequestTimeoutInterval);
        await setResourceTimeoutInterval(testResourceTimeoutInterval);
        await setMaxConnections(testMaxConnections);
        await createApiClientScrollView.scrollTo("bottom");
        await setRetry(testRetry);
        await createApiClientScrollView.scrollTo("bottom");
        await toggleOnWaitsForConnectivityCheckbox();
        await toggleOnCancelRequestsOn401Checkbox();
        await createClient();

        // * Verify created client
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, testHeaders);

        // # Open client list screen
        await ApiClientScreen.back();
    });

    it("should not be able to create an API client with existing URL", async () => {
        const { errorTitle, okButton } = Alert;

        // # Open create API client screen
        await CreateApiClientScreen.open();

        // # Set an existing url and attempt to create client
        await setName(testName);
        await setBaseUrl(testBaseUrl);
        await createApiClientScrollView.scrollTo("bottom");
        await createClient();

        // * Verify error alert
        await expect(errorTitle).toBeVisible();
        await expect(
            element(by.text(`A client for ${testBaseUrl} already exists`))
        ).toBeVisible();
        await okButton.tap();
        await CreateApiClientScreen.toBeVisible();

        // # Open client list screen
        await CreateApiClientScreen.back();
    });

    it("should be able to remove an API client", async () => {
        // # Remove client
        await removeClientWithName(testName);

        // * Verify client is removed
        await expect(element(by.text(testName))).not.toBeVisible();
    });
});
