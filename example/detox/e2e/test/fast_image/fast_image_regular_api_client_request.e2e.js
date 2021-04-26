// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    clientCertPassword,
    fastImageServerUrl,
    secureFastImageServerClientCertUrl,
    secureFastImageServerUrl,
} from "@support/test_config";
import {
    ApiClientFastImageScreen,
    ApiClientImportP12Screen,
    ApiClientScreen,
} from "@support/ui/screen";
import { isAndroid } from "@support/utils";
import { verifyApiClient } from "../helpers";

describe("Fast Image Regular - API Client Request", () => {
    const testBaseUrl = fastImageServerUrl;
    const testImageUrl = `${testBaseUrl}/api/files/fast-image.jpg`;
    const testName = "Fast Image Server API";
    const testSecureBaseUrl = secureFastImageServerUrl;
    const testSecureImageUrl = `${testSecureBaseUrl}/api/files/fast-image.jpg`;
    const testSecureName = "Secure Fast Image Server API";
    const {
        fastImage,
        imageNotSupportedIcon,
        setImageUrl,
    } = ApiClientFastImageScreen;

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should display fast image - regular request", async () => {
        // # Select fast image
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectFastImage();

        // * Verify image not supported is displayed
        await setImageUrl("");
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(testImageUrl);

        // * Verify fast image is displayed
        await expect(fastImage).toBeVisible();
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
            secureFastImageServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectFastImage();

        // * Verify image not supported is displayed
        await setImageUrl("");
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(testSecureImageUrl);

        // * Verify fast image is displayed
        await expect(fastImage).toBeVisible();
    });
});
