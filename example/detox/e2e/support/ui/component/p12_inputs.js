// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class P12Inputs {
    testID = {
        pathText: "p12_inputs.path.text",
        passwordInput: "p12_inputs.password.input",
        urlInput: "p12_inputs.url.input",
    };

    pathText = element(by.id(this.testID.pathText));
    passwordInput = element(by.id(this.testID.passwordInput));
    urlInput = element(by.id(this.testID.urlInput));
    downloadButton = element(by.text("Download"));
    selectButton = element(by.text("Select"));

    downloadP12 = async (url, password) => {
        await this.setUrl(url);
        await this.downloadButton.tap();
        await expect(this.downloadButton).not.toExist();
        await this.setPassword(password);
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

const p12Inputs = new P12Inputs();
export default p12Inputs;
