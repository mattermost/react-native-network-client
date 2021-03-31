// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    clientCertPassword,
    fileUploadServerUrl,
    secureFileUploadServerClientCertUrl,
    secureFileUploadServerUrl,
} from "@support/test_config";
import {
    ApiClientImportP12Screen,
    ApiClientScreen,
    ApiClientUploadScreen,
} from "@support/ui/screen";
import { isAndroid } from "@support/utils";
import { verifyApiClient } from "../helpers";

describe("Upload - API Client Request", () => {
    const {
        setEndpoint,
        toggleOnSendAsMultipartCheckbox,
    } = ApiClientUploadScreen;
    const testBaseUrl = fileUploadServerUrl;
    const testName = "File Upload Server API";
    const testSecureBaseUrl = secureFileUploadServerUrl;
    const testSecureName = "Secure File Upload Server API";
    const testImageFilename = "sample-image.jpg";
    const testStreamEndpoint = `/api/files/stream/${testImageFilename}`;
    const testMultipartEndpoint = `/api/files/multipart`;

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to stream upload selected file", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Select upload
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectUpload();

        // # Set endpoint
        await setEndpoint(testStreamEndpoint);

        // # Upload file and verify
        await uploadFileAndVerify(testImageFilename);
    });

    it("should be able to stream upload selected file - secure connection", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Import p12 and select upload
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(
            secureFileUploadServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectUpload();

        // # Set endpoint
        await setEndpoint(testStreamEndpoint);

        // # Upload file and verify
        await uploadFileAndVerify(testImageFilename);
    });

    it("should be able to multipart upload selected file", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Select upload
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectUpload();

        // # Set endpoint
        await setEndpoint(testMultipartEndpoint);
        await toggleOnSendAsMultipartCheckbox();

        // # Upload file and verify
        await uploadFileAndVerify(testImageFilename);
    });

    it("should be able to multipart upload selected file - secure connection", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Import p12 and select upload
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(
            secureFileUploadServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectUpload();

        // # Set endpoint
        await setEndpoint(testMultipartEndpoint);
        await toggleOnSendAsMultipartCheckbox();

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
        resetButton,
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
    await expect(resetButton).not.toBeVisible();
}
