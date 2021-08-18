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
import { ResponseSuccessOverlay } from "@support/ui/component";
import {
    ApiClientDownloadScreen,
    ApiClientImportP12Screen,
    ApiClientScreen,
} from "@support/ui/screen";
import { isAndroid } from "@support/utils";
import { verifyApiClient } from "../helpers";

describe("Download - API Client Request", () => {
    const testEndpoint = "/api/files/sample.txt";
    const testBaseUrl = fileDownloadServerUrl;
    const testName = "File Download Server API";
    const testSecureBaseUrl = secureFileDownloadServerUrl;
    const testSecureName = "Secure File Download Server API";
    const testStatus = 200;
    const { setEndpoint } = ApiClientDownloadScreen;

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to download file", async () => {
        // # Select download
        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl);
        await ApiClientScreen.selectDownload();

        // # Set endpoint
        await setEndpoint(testEndpoint);

        // # Download file and verify
        await downloadFileAndVerify(testStatus);
    });

    it("should be able to download file - secure connection", async () => {
        // # Do not run against Android due to file attachment limitation
        if (isAndroid()) {
            return;
        }

        // # Import p12 and select download
        await ApiClientScreen.open(testSecureName);
        await verifyApiClient(testSecureName, testSecureBaseUrl);
        await ApiClientScreen.selectImportP12();
        await ApiClientImportP12Screen.importP12(
            secureFileDownloadServerClientCertUrl,
            clientCertPassword
        );
        await ApiClientScreen.selectDownload();

        // # Set endpoint
        await setEndpoint(testEndpoint);

        // # Download file and verify
        await downloadFileAndVerify(testStatus);
    });
});

async function downloadFileAndVerify(testStatus) {
    const { filePathInput, makeDownloadRequest, progressBar } =
        ApiClientDownloadScreen;
    const { responseSuccessCodeText, responseSuccessOkText } =
        ResponseSuccessOverlay;

    // # Focus on file path to set default
    await filePathInput.tap();

    // * Verify progress bar
    await expect(progressBar).toBeVisible();

    // # Download file
    await makeDownloadRequest();

    // * Verify response success overlay
    await expect(responseSuccessCodeText).toHaveText(testStatus.toString());
    await expect(responseSuccessOkText).toHaveText(
        testStatus === 200 ? "true" : "false"
    );

    // # Close response success overlay
    await ResponseSuccessOverlay.close();
}
