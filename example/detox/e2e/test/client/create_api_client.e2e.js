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

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to create an API client", async () => {
        // Create API client
        await CreateApiClientScreen.open();
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

    it("should be able to create an API client - secure connection", async () => {
        // # Remove dupe preset
        await removeApiClient("Secure Mockserver API");

        // Create API client
        const testSecureName = `Secure ${testName}`;
        const testSecureBaseUrl = secureServerUrl;
        await CreateApiClientScreen.open();
        await createApiClient(
            testSecureName,
            testSecureBaseUrl,
            testHeaders,
            testToken,
            testRequestTimeoutInterval,
            testResourceTimeoutInterval,
            testMaxConnections,
            testRetry,
            { secure: true }
        );

        // Alert for duplicate API client
        await alertForDuplicateApiClient(testSecureName, testSecureBaseUrl);

        // # Remove API client
        await removeApiClient(testSecureName);
    });
});

async function createApiClient(
    testName,
    testBaseUrl,
    testHeaders,
    testToken,
    testRequestTimeoutInterval,
    testResourceTimeoutInterval,
    testMaxConnections,
    testRetry,
    { secure = false }
) {
    const {
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
        toggleOnTrustSelfSignedServerCertificateCheckbox,
        toggleOnWaitsForConnectivityCheckbox,
    } = CreateApiClientScreen;

    // # Set all fields and create client
    await setName(testName);
    await setBaseUrl(testBaseUrl);
    await setHeaders(testHeaders);
    await setBearerAuthToken(testToken);
    if (secure) {
        await CreateApiClientScreen.downloadP12(
            secureServerClientCertUrl,
            clientCertPassword
        );
    }
    await setRequestTimeoutInterval(testRequestTimeoutInterval);
    await setResourceTimeoutInterval(testResourceTimeoutInterval);
    await setMaxConnections(testMaxConnections);
    await toggleOnWaitsForConnectivityCheckbox();
    await toggleOnCancelRequestsOn401Checkbox();
    await toggleOnTrustSelfSignedServerCertificateCheckbox();
    await setRetry(testRetry);
    await createClient();

    // * Verify created client
    await ApiClientScreen.open(testName);
    await verifyApiClient(testName, testBaseUrl, testHeaders);

    // # Open client list screen
    await ApiClientScreen.back();
}

async function alertForDuplicateApiClient(testName, testBaseUrl) {
    const { createClient, setBaseUrl, setName } = CreateApiClientScreen;
    const { errorTitle, okButton } = Alert;

    // # Open create API client screen
    await CreateApiClientScreen.open();

    // # Set an existing url and attempt to create client
    await setName(testName);
    await setBaseUrl(testBaseUrl);
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
}

async function removeApiClient(testName) {
    // # Remove client
    await ClientListScreen.removeClientByName(testName);

    // * Verify client is removed
    await expect(element(by.text(testName))).not.toBeVisible();
}
