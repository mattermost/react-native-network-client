// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { fastImageServerUrl } from "@support/test_config";
import { ApiClientFastImageScreen, ApiClientScreen } from "@support/ui/screen";
import { verifyApiClient } from "../helpers";

describe("Fast Image Cookie Token - API Client Request", () => {
    const testBaseUrl = fastImageServerUrl;
    const testLoginUrl = `${testBaseUrl}/login/123`;
    const testImageUrl = `${testBaseUrl}/protected/api/files/fast-image.jpg`;
    const testName = "Fast Image Server API";
    const {
        fastImage,
        imageNotSupportedIcon,
        setImageUrl,
    } = ApiClientFastImageScreen;

    beforeAll(async () => {
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectFastImage();
    });

    it("should display fast image - with cookie token on protected request", async () => {
        // # Login to get token
        await setImageUrl(testLoginUrl);
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(`${testImageUrl}?tokenSource=cookies`);

        // * Verify fast image is displayed
        await expect(fastImage).toBeVisible();
    });

    it("should not display fast image - no cookie token on protected request", async () => {
        // * Verify image not supported is displayed
        await setImageUrl("");
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(`${testImageUrl}?tokenSource=none`);

        // * Verify image not supported is displayed
        await expect(imageNotSupportedIcon).toBeVisible();
    });
});
