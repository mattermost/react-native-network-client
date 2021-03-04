// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {fastImageServerUrl} from '@support/test_config';
import {
    ApiClientFastImageScreen,
    ApiClientScreen,
} from '@support/ui/screen';
import {verifyApiClient} from '../helpers';

describe('Fast Image - API Client Request', () => {
    const testBaseUrl = fastImageServerUrl;
    const testImageUrl = `${testBaseUrl}/api/files/fast-image.jpg`;
    const testName = 'Fast Image Server API';

    beforeAll(async () => {
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.fastImageButton.tap();
    });

    it('should display fast image', async () => {
        const {
            fastImage,
            imageNotSupportedIcon,
            setImageUrl,
        } = ApiClientFastImageScreen;

        // * Verify image not supported is displayed
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(testImageUrl);

        // * Verify fast image is displayed
        await expect(fastImage).toBeVisible();
        await expect(imageNotSupportedIcon).not.toBeVisible();
    });
});
