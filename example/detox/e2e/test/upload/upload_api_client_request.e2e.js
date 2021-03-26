// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { fileUploadServerUrl } from "@support/test_config";
import { ApiClientScreen, ApiClientUploadScreen } from "@support/ui/screen";
import { isAndroid } from "@support/utils";
import { verifyApiClient } from "../helpers";

describe("Upload - API Client Request", () => {
    const { setEndpoint } = ApiClientUploadScreen;
    const testBaseUrl = fileUploadServerUrl;
    const testImageFilename = "sample-image.jpg";
    const testStreamEndpoint = `/api/files/stream/${testImageFilename}`;
    const testName = "File Upload Server API";

    beforeAll(async () => {
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectUpload();
    });

    it("should be able to stream upload selected file", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Set endpoint
        await setEndpoint(testStreamEndpoint);

        // # Upload file and verify
        await uploadFileAndVerify(testImageFilename);
    });
});

async function uploadFileAndVerify(testImageFilename) {
    const {
        apiClientUploadScrollView,
        attachImageButton,
        fileComponent,
        filename,
        fileUri,
        progressBar,
        uploadFileButton,
    } = ApiClientUploadScreen;

    // # Select file
    await attachImageButton.tap();

    // * Verify file is selected
    await expect(fileComponent).toBeVisible();
    await expect(filename).toHaveText(testImageFilename);
    await apiClientUploadScrollView.scrollTo("bottom");
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
}
