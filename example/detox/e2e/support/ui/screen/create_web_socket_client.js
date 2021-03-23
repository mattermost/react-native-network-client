// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { ClientListScreen } from "@support/ui/screen";
import { isAndroid } from "@support/utils";

class CreateWebSocketClientScreen {
    createWebSocketClientScreen = element(by.text("CreateWebSocketClient"));
    allowSelfSignedCertificatesCheckboxFalse = element(
        by.text("Allow Self Signed Certificates? [false]")
    );
    allowSelfSignedCertificatesCheckboxTrue = element(
        by.text("Allow Self Signed Certificates? [true]")
    );
    enableCompressionCheckboxFalse = element(
        by.text("Enable Compression? [false]")
    );
    enableCompressionCheckboxTrue = element(
        by.text("Enable Compression? [true]")
    );
    enableSslPinningCheckboxFalse = element(
        by.text("Enable SSL Pinning? [false]")
    );
    enableSslPinningCheckboxTrue = element(
        by.text("Enable SSL Pinning? [true]")
    );
    clientListButton = element(by.text("ClientList")).atIndex(0);
    createButton = element(by.text("Create"));

    toBeVisible = async () => {
        await expect(this.createWebSocketClientScreen).toBeVisible();

        return this.createWebSocketClientScreen;
    };

    open = async () => {
        // # Open create web socket client screen
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

    toggleOffAllowSelfSignedCertificatesCheckbox = async () => {
        await this.allowSelfSignedCertificatesCheckboxTrue.tap();
        await expect(
            this.allowSelfSignedCertificatesCheckboxFalse
        ).toBeVisible();
    };

    toggleOnAllowSelfSignedCertificatesCheckbox = async () => {
        await this.allowSelfSignedCertificatesCheckboxFalse.tap();
        await expect(
            this.allowSelfSignedCertificatesCheckboxTrue
        ).toBeVisible();
    };

    toggleOffEnableCompressionCheckbox = async () => {
        await this.enableCompressionCheckboxTrue.tap();
        await expect(this.enableCompressionCheckboxFalse).toBeVisible();
    };

    toggleOnEnableCompressionCheckbox = async () => {
        await this.enableCompressionCheckboxFalse.tap();
        await expect(this.enableCompressionCheckboxTrue).toBeVisible();
    };

    toggleOffEnableSslPinningCheckbox = async () => {
        await this.enableSslPinningCheckboxTrue.tap();
        await expect(this.enableSslPinningCheckboxFalse).toBeVisible();
    };

    toggleOnEnableSslPinningCheckbox = async () => {
        await this.enableSslPinningCheckboxFalse.tap();
        await expect(this.enableSslPinningCheckboxTrue).toBeVisible();
    };
}

const createWebSocketClientScreen = new CreateWebSocketClientScreen();
export default createWebSocketClientScreen;
