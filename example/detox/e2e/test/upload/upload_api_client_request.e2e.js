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
import { isAndroid, waitForAndScrollDown } from "@support/utils";
import { verifyApiClient, verifyResponseSuccessOverlay } from "../helpers";

describe("Upload - API Client Request", () => {
    const {
        setEndpoint,
        toggleOnSendAsMultipartCheckbox,
    } = ApiClientUploadScreen;
    const testImageFilename = "sample-image.jpg";
    const testStreamEndpoint = `/api/files/stream/${testImageFilename}`;
    const testMultipartEndpoint = `/api/files/multipart`;
    const testBaseUrl = fileUploadServerUrl;
    const testStreamUrl = `${testBaseUrl}${testStreamEndpoint}`;
    const testMultipartUrl = `${testBaseUrl}${testMultipartEndpoint}`;
    const testName = "File Upload Server API";
    const testSecureBaseUrl = secureFileUploadServerUrl;
    const testSecureStreamUrl = `${testSecureBaseUrl}${testStreamEndpoint}`;
    const testSecureMultipartUrl = `${testSecureBaseUrl}${testMultipartEndpoint}`;
    const testSecureName = "Secure File Upload Server API";
    const testStatus = 200;

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
        await uploadFileAndVerify(
            testImageFilename,
            testStreamUrl,
            testStatus,
            { secure: false }
        );
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
        await uploadFileAndVerify(
            testImageFilename,
            testSecureStreamUrl,
            testStatus,
            { secure: true }
        );
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
        await uploadFileAndVerify(
            testImageFilename,
            testMultipartUrl,
            testStatus,
            { secure: false }
        );
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
        await uploadFileAndVerify(
            testImageFilename,
            testSecureMultipartUrl,
            testStatus,
            { secure: true }
        );
    });
});

async function uploadFileAndVerify(
    testImageFilename,
    testServerUrl,
    testStatus,
    { secure = false, server = "file-server" }
) {
    const {
        attachImageButton,
        fileComponent,
        filename,
        fileUri,
        makeUploadRequest,
        progressBar,
    } = ApiClientUploadScreen;

    // # Select file
    await attachImageButton.tap();

    // * Verify file is selected
    await expect(fileComponent).toBeVisible();
    await expect(filename).toHaveText(testImageFilename);
    await waitForAndScrollDown(
        fileUri,
        ApiClientUploadScreen.testID.apiClientUploadScrollView
    );
    await expect(fileUri).toBeVisible();
    await expect(progressBar).toBeVisible();

    // # Upload file
    await makeUploadRequest();

    // * Verify response success overlay
    await verifyResponseSuccessOverlay(
        testServerUrl,
        testStatus,
        null,
        null,
        null,
        null,
        { secure, server }
    );
}
