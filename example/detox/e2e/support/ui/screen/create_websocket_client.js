// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {AddHeaders} from '@support/ui/component';
import {ClientListScreen} from '@support/ui/screen';
import {isAndroid} from '@support/utils';

class CreateWebSocketClientScreen {
    testID = {
        nameInput: 'create_websocket_client.name.input',
        timeoutIntervalInput: 'create_websocket_client.timeout_interval.input',
        urlInput: 'create_websocket_client.url.input',
    }

    createWebSocketClientScreen = element(by.text('CreateWebSocketClient'));
    nameInput = element(by.id(this.testID.nameInput));
    timeoutIntervalInput = element(by.id(this.testID.timeoutIntervalInput));
    urlInput = element(by.id(this.testID.urlInput));
    enableCompressionCheckboxFalse = element(by.text('Enable Compression? false'));
    enableCompressionCheckboxTrue = element(by.text('Enable Compression? true'));
    clientListButton = element(by.text('ClientList')).atIndex(0);
    createButton = element(by.text('Create'));

    toBeVisible = async () => {
        await expect(this.createWebSocketClientScreen).toBeVisible();

        return this.createWebSocketClientScreen;
    }

    open = async () => {
        // # Open create WebSocket client screen
        await ClientListScreen.addWebSocketClientButton.tap();

        return this.toBeVisible();
    }

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.clientListButton.tap();
        }
        await expect(this.createWebSocketClientScreen).not.toBeVisible();
    }

    createClient = async () => {
        await this.createButton.tap();
    }

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    }

    setName = async (name) => {
        await this.nameInput.clearText();
        await this.nameInput.replaceText(name);
        await this.nameInput.tapReturnKey();
    }

    setTimeoutInterval = async (timeoutInterval) => {
        await this.timeoutIntervalInput.clearText();
        await this.timeoutIntervalInput.replaceText(timeoutInterval);
        await this.timeoutIntervalInput.tapReturnKey();
    }

    setUrl = async (url) => {
        await this.urlInput.clearText();
        await this.urlInput.replaceText(url);
        await this.urlInput.tapReturnKey();
    }

    toggleOffEnableCompressionCheckbox = async () => {
        await this.enableCompressionCheckboxTrue.tap();
        await expect(this.enableCompressionCheckboxFalse).toBeVisible();
    }

    toggleOnEnableCompressionCheckbox = async () => {
        await this.enableCompressionCheckboxFalse.tap();
        await expect(this.enableCompressionCheckboxTrue).toBeVisible();
    }
}

const createWebSocketClientScreen = new CreateWebSocketClientScreen();
export default createWebSocketClientScreen;
