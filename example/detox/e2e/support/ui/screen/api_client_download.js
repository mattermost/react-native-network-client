// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { isAndroid, waitForAndScrollDown } from "@support/utils";

class ApiClientDownloadScreen {
    testID = {
        apiClientDownloadScrollView: "api_client_download.scroll_view",
        endpointInput: "api_client_download.endpoint.input",
        filePathInput: "api_client_download.file_path.input",
        progressBar: "progress_file_download.progress_bar",
    };

    apiClientDownloadScreen = element(by.text("APIClientDownload"));
    apiClientButton = element(by.text("APIClient")).atIndex(0);
    endpointInput = element(by.id(this.testID.endpointInput));
    filePathInput = element(by.id(this.testID.filePathInput));
    progressBar = element(by.id(this.testID.progressBar));
    downloadFileButton = element(by.text("Download File"));
    cancelDownloadButton = element(by.text("Cancel Download"));
    resetButton = element(by.text("Reset"));

    toBeVisible = async () => {
        await expect(this.apiClientDownloadScreen).toBeVisible();

        return this.apiClientDownloadScreen;
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.apiClientButton.tap();
        }
        await expect(this.apiClientDownloadScreen).not.toBeVisible();
    };

    makeDownloadRequest = async () => {
        await waitForAndScrollDown(
            this.downloadFileButton,
            this.testID.apiClientDownloadScrollView
        );
        await this.downloadFileButton.tap();
    };

    setEndpoint = async (endpoint) => {
        await this.endpointInput.clearText();
        await this.endpointInput.replaceText(endpoint);
        await this.endpointInput.tapReturnKey();
    };

    setFilePath = async (filePath) => {
        await this.filePathInput.clearText();
        await this.filePathInput.replaceText(filePath);
        await this.filePathInput.tapReturnKey();
    };
}

const apiClientDownloadScreen = new ApiClientDownloadScreen();
export default apiClientDownloadScreen;
