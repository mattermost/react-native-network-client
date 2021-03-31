// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { isAndroid } from "@support/utils";

class ApiClientImportP12Screen {
    testID = {
        pathText: "api_client_import_p12.p12_inputs.path.text",
        passwordInput: "api_client_import_p12.p12_inputs.password.input",
        urlInput: "api_client_import_p12.p12_inputs.url.input",
    };

    apiClientImportP12Screen = element(by.text("APIClientUpload"));
    pathText = element(by.id(this.testID.pathText));
    passwordInput = element(by.id(this.testID.passwordInput));
    urlInput = element(by.id(this.testID.urlInput));
    downloadButton = element(by.text("Download"));
    selectButton = element(by.text("Select"));
    importButton = element(by.text("Import"));

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

    importP12 = async (url, password) => {
        await this.setUrl(url);
        await this.downloadButton.tap();
        await expect(this.downloadButton).not.toExist();
        await this.setPassword(password);
        await this.importButton.tap();
    };

    setPassword = async (password) => {
        await this.passwordInput.clearText();
        await this.passwordInput.replaceText(password);
        await this.passwordInput.tapReturnKey();
    };

    setUrl = async (url) => {
        await this.urlInput.clearText();
        await this.urlInput.replaceText(url);
        await this.urlInput.tapReturnKey();
    };
}

const apiClientImportP12Screen = new ApiClientImportP12Screen();
export default apiClientImportP12Screen;
