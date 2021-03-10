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

describe('Fast Image Regular - API Client Request', () => {
    const testBaseUrl = fastImageServerUrl;
    const testImageUrl = `${testBaseUrl}/api/files/fast-image.jpg`;
    const testName = 'Fast Image Server API';
    const {
        fastImage,
        imageNotSupportedIcon,
        setImageUrl,
    } = ApiClientFastImageScreen;

    beforeAll(async () => {
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.fastImageButton.tap();
    });

    it('should display fast image - regular request', async () => {
        // * Verify image not supported is displayed
        await setImageUrl('');
        await expect(imageNotSupportedIcon).toBeVisible();

        // # Set image url
        await setImageUrl(testImageUrl);

        // * Verify fast image is displayed
        await expect(fastImage).toBeVisible();
    });
});
