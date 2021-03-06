// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { AddHeaders, P12Inputs } from "@support/ui/component";
import { ClientListScreen } from "@support/ui/screen";
import { isAndroid, waitForAndScrollDown } from "@support/utils";

class CreateWebSocketClientScreen {
    testID = {
        createWebSocketClientScrollView: "create_websocket_client.scroll_view",
        nameInput: "create_websocket_client.name.input",
        timeoutIntervalInput: "create_websocket_client.timeout_interval.input",
        urlInput: "create_websocket_client.url.input",
    };

    createWebSocketClientScreen = element(by.text("CreateWebSocketClient"));
    createWebSocketClientScrollView = element(
        by.id(this.testID.createWebSocketClientScrollView)
    );
    nameInput = element(by.id(this.testID.nameInput));
    timeoutIntervalInput = element(by.id(this.testID.timeoutIntervalInput));
    urlInput = element(by.id(this.testID.urlInput));
    alertOnClientErrorCheckboxFalse = element(
        by.text("Alert on client error? [false]")
    );
    alertOnClientErrorCheckboxTrue = element(
        by.text("Alert on client error? [true]")
    );
    enableCompressionCheckboxFalse = element(
        by.text("Enable Compression? [false]")
    );
    enableCompressionCheckboxTrue = element(
        by.text("Enable Compression? [true]")
    );
    trustSelfSignedServerCertificateCheckboxFalse = element(
        by.text("Trust Self-Signed Server Certificate? [false]")
    );
    trustSelfSignedServerCertificateCheckboxTrue = element(
        by.text("Trust Self-Signed Server Certificate? [true]")
    );
    clientListButton = element(by.text("ClientList")).atIndex(0);
    createButton = element(by.text("Create"));

    // convenience props
    p12PathText = P12Inputs.pathText;
    p12PasswordInput = P12Inputs.passwordInput;
    p12UrlInput = P12Inputs.urlInput;
    p12DownloadButton = P12Inputs.downloadButton;
    p12SelectButton = P12Inputs.selectButton;

    toBeVisible = async () => {
        await expect(this.createWebSocketClientScreen).toBeVisible();

        return this.createWebSocketClientScreen;
    };

    open = async () => {
        // # Open create WebSocket client screen
        await ClientListScreen.addWebSocketClientButton.tap();

        return this.toBeVisible();
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.clientListButton.tap();
        }
        await expect(this.createWebSocketClientScreen).not.toBeVisible();
    };

    createClient = async () => {
        await waitForAndScrollDown(
            this.createButton,
            this.testID.createWebSocketClientScrollView
        );
        await this.createButton.tap();
    };

    downloadP12 = async (downloadUrl, password) => {
        await P12Inputs.downloadP12(downloadUrl, password);
    };

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    };

    setName = async (name) => {
        await waitForAndScrollDown(
            this.nameInput,
            this.testID.createWebSocketClientScrollView
        );
        await this.nameInput.clearText();
        await this.nameInput.replaceText(name);
        await this.nameInput.tapReturnKey();
    };

    setTimeoutInterval = async (timeoutInterval) => {
        const timeoutIntervalStr = timeoutInterval.toString();
        await waitForAndScrollDown(
            this.timeoutIntervalInput,
            this.testID.createWebSocketClientScrollView
        );
        await this.timeoutIntervalInput.clearText();
        await this.timeoutIntervalInput.replaceText(timeoutIntervalStr);
        await this.timeoutIntervalInput.tapReturnKey();
    };

    setUrl = async (url) => {
        await waitForAndScrollDown(
            this.urlInput,
            this.testID.createWebSocketClientScrollView
        );
        await this.urlInput.clearText();
        await this.urlInput.replaceText(url);
        await this.urlInput.tapReturnKey();
    };

    toggleOffAlertOnClientErrorCheckbox = async () => {
        await waitForAndScrollDown(
            this.alertOnClientErrorCheckboxTrue,
            this.testID.createWebSocketClientScrollView
        );
        await this.alertOnClientErrorCheckboxTrue.tap();
        await expect(this.alertOnClientErrorCheckboxFalse).toBeVisible();
    };

    toggleOnAlertOnClientErrorCheckbox = async () => {
        await waitForAndScrollDown(
            this.alertOnClientErrorCheckboxFalse,
            this.testID.createWebSocketClientScrollView
        );
        await this.alertOnClientErrorCheckboxFalse.tap();
        await expect(this.alertOnClientErrorCheckboxTrue).toBeVisible();
    };

    toggleOffEnableCompressionCheckbox = async () => {
        await waitForAndScrollDown(
            this.enableCompressionCheckboxTrue,
            this.testID.createWebSocketClientScrollView
        );
        await this.enableCompressionCheckboxTrue.tap();
        await expect(this.enableCompressionCheckboxFalse).toBeVisible();
    };

    toggleOnEnableCompressionCheckbox = async () => {
        await waitForAndScrollDown(
            this.enableCompressionCheckboxFalse,
            this.testID.createWebSocketClientScrollView
        );
        await this.enableCompressionCheckboxFalse.tap();
        await expect(this.enableCompressionCheckboxTrue).toBeVisible();
    };

    toggleOffTrustSelfSignedServerCertificateCheckbox = async () => {
        await waitForAndScrollDown(
            this.trustSelfSignedServerCertificateCheckboxTrue,
            this.testID.createWebSocketClientScrollView
        );
        await this.trustSelfSignedServerCertificateCheckboxTrue.tap();
        await expect(
            this.trustSelfSignedServerCertificateCheckboxFalse
        ).toBeVisible();
    };

    toggleOnTrustSelfSignedServerCertificateCheckbox = async () => {
        await waitForAndScrollDown(
            this.trustSelfSignedServerCertificateCheckboxFalse,
            this.testID.createWebSocketClientScrollView
        );
        await this.trustSelfSignedServerCertificateCheckboxFalse.tap();
        await expect(
            this.trustSelfSignedServerCertificateCheckboxTrue
        ).toBeVisible();
    };
}

const createWebSocketClientScreen = new CreateWebSocketClientScreen();
export default createWebSocketClientScreen;
