// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {fileUploadServerUrl} from '@support/test_config';
import {
    ApiClientScreen,
    ApiClientUploadScreen,
} from '@support/ui/screen';
import {verifyApiClient} from '../helpers';

describe('Upload - API Client Request', () => {
    const testBaseUrl = fileUploadServerUrl;
    const testImageFilename = 'sample-image.jpg';
    const testEndpoint = `/api/files/${testImageFilename}`;
    const testName = 'File Upload Server API';

    beforeAll(async () => {
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectUpload();
    });

    it('should be able to upload selected file', async () => {
        const {
            attachImageButton,
            fileComponent,
            filename,
            fileUri,
            progressBar,
            setEndpoint,
            uploadFileButton,
        } = ApiClientUploadScreen;

        // # Set endpoint and select file
        await setEndpoint(testEndpoint);
        await attachImageButton.tap();

        // * Verify file is selected
        await expect(fileComponent).toBeVisible();
        await expect(filename).toHaveText(testImageFilename);
        await expect(fileUri).toBeVisible();
        await expect(progressBar).toBeVisible();

        // # Upload file
        await uploadFileButton.tap();

        // * Verify uploaded
        await ApiClientUploadScreen.toBeVisible();
        await expect(uploadFileButton).not.toBeVisible();
        await expect(fileComponent).not.toBeVisible();
        await expect(filename).not.toBeVisible();
        await expect(progressBar).not.toBeVisible();
    });
});
