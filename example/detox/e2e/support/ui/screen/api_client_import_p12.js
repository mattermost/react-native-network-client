// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { P12Inputs } from "@support/ui/component";
import { isAndroid } from "@support/utils";

class ApiClientImportP12Screen {
    apiClientImportP12Screen = element(by.text("APIClientImportP12"));
    apiClientButton = element(by.text("APIClient")).atIndex(0);
    importButton = element(by.text("Import"));

    // convenience props
    p12PathText = P12Inputs.pathText;
    p12PasswordInput = P12Inputs.passwordInput;
    p12UrlInput = P12Inputs.urlInput;
    p12DownloadButton = P12Inputs.downloadButton;
    p12SelectButton = P12Inputs.selectButton;

    toBeVisible = async () => {
        await expect(this.apiClientImportP12Screen).toBeVisible();

        return this.apiClientImportP12Screen;
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.apiClientButton.tap();
        }
        await expect(this.apiClientImportP12Screen).not.toBeVisible();
    };

    importP12 = async (downloadUrl, password) => {
        await P12Inputs.downloadP12(downloadUrl, password);
        await this.importButton.tap();
        await this.back();
    };

    setPassword = async (password) => {
        await P12Inputs.setPassword(password);
    };

    setDownloadUrl = async (downloadUrl) => {
        await P12Inputs.setDownloadUrl(downloadUrl);
    };
}

const apiClientImportP12Screen = new ApiClientImportP12Screen();
export default apiClientImportP12Screen;
