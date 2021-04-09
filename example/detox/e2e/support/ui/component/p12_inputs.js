// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class P12Inputs {
    testID = {
        pathText: "p12_inputs.path.text",
        downloadUrlInput: "p12_inputs.download_url.input",
        passwordInput: "p12_inputs.password.input",
    };

    pathText = element(by.id(this.testID.pathText));
    downloadUrlInput = element(by.id(this.testID.downloadUrlInput));
    passwordInput = element(by.id(this.testID.passwordInput));
    downloadButton = element(by.text("Download"));
    selectButton = element(by.text("Select"));

    downloadP12 = async (downloadUrl, password) => {
        await this.setDownloadUrl(downloadUrl);
        await this.downloadButton.tap();
        await expect(this.downloadButton).not.toExist();
        await this.setPassword(password);
    };

    setPassword = async (password) => {
        await this.passwordInput.clearText();
        await this.passwordInput.replaceText(password);
        await this.passwordInput.tapReturnKey();
    };

    setDownloadUrl = async (downloadUrl) => {
        await this.downloadUrlInput.clearText();
        await this.downloadUrlInput.replaceText(downloadUrl);
        await this.downloadUrlInput.tapReturnKey();
    };
}

const p12Inputs = new P12Inputs();
export default p12Inputs;
