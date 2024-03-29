// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    clientCertPassword,
    fileDownloadServerUrl,
    secureFileDownloadServerClientCertUrl,
    secureFileDownloadServerUrl,
} from "@support/test_config";
import {
    ApiClientFastImageScreen,
    ApiClientImportP12Screen,
    ApiClientScreen,
} from "@support/ui/screen";
import { isAndroid } from "@support/utils";
import { verifyApiClient } from "../helpers";

describe("Fast Image Regular - API Client Request", () => {
    const testBaseUrl = fileDownloadServerUrl;
    const testImageUrl = `${testBaseUrl}/api/files/fast-image.jpg`;
    const testName = "File Download Server API";
    const testSecureBaseUrl = secureFileDownloadServerUrl;
    const testSecureImageUrl = `${testSecureBaseUrl}/api/files/fast-image.jpg`;
    const testSecureName = "Secure File Download Server API";
    const { imageNotSupportedIcon, setImageUrl } = ApiClientFastImageScreen;

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should display fast image - regular request", async () => {
        // # Select fast image
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectFastImage();

        // * Verify image not supported is displayed
        await setImageUrl(testBaseUrl);
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(testImageUrl);

        // * Verify image not supported is not displayed
        await expect(imageNotSupportedIcon).not.toBeVisible();
    });

    it("should display fast image - regular request - secure connection", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Import p12 and select fast image
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(
            secureFileDownloadServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectFastImage();

        // * Verify image not supported is displayed
        await setImageUrl(testSecureBaseUrl);
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(testSecureImageUrl);

        // * Verify image not supported is not displayed
        await expect(imageNotSupportedIcon).not.toBeVisible();
    });
});
