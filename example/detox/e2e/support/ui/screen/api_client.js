// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    ClientListItem,
    HeaderListItem,
    MethodButtons,
} from "@support/ui/component";
import { ClientListScreen } from "@support/ui/screen";
import { isAndroid, waitForAndScrollDown } from "@support/utils";

class ApiClientScreen {
    testID = {
        apiClientScrollView: "api_client.scroll_view",
        baseUrlInput: "api_client.base_url.input",
        nameInput: "api_client.name.input",
    };

    apiClientScreen = element(by.text("APIClient"));
    apiClientScrollView = element(by.id(this.testID.apiClientScrollView));
    baseUrlInput = element(by.id(this.testID.baseUrlInput));
    nameInput = element(by.id(this.testID.nameInput));
    clientListButton = element(by.text("ClientList")).atIndex(0);
    fastImageButton = element(by.text("FAST IMAGE"));
    importP12Button = element(by.text("IMPORT P12"));
    uploadButton = element(by.text("UPLOAD"));

    // convenience props
    deleteButton = MethodButtons.deleteButton;
    getButton = MethodButtons.getButton;
    patchButton = MethodButtons.patchButton;
    postButton = MethodButtons.postButton;
    putButton = MethodButtons.putButton;

    getHeaderListItemAtIndex = (index) => {
        return HeaderListItem.getListHeadersItemAtIndex(index);
    };

    toBeVisible = async () => {
        await expect(this.apiClientScreen).toBeVisible();

        return this.apiClientScreen;
    };

    open = async (name) => {
        // # Open API client screen
        const { item } = ClientListItem.getItemByName(name);
        await waitForAndScrollDown(
            item,
            ClientListScreen.testID.clientListScrollView
        );
        await item.tap();

        return this.toBeVisible();
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.clientListButton.tap();
        }
        await expect(this.apiClientScreen).not.toBeVisible();
    };

    selectDelete = async () => {
        await waitForAndScrollDown(
            this.deleteButton,
            this.testID.apiClientScrollView
        );
        await this.deleteButton.tap();
    };

    selectGet = async () => {
        await waitForAndScrollDown(
            this.getButton,
            this.testID.apiClientScrollView
        );
        await this.getButton.tap();
    };

    selectFastImage = async () => {
        await waitForAndScrollDown(
            this.fastImageButton,
            this.testID.apiClientScrollView
        );
        await this.fastImageButton.tap();
    };

    selectImportP12 = async () => {
        await waitForAndScrollDown(
            this.importP12Button,
            this.testID.apiClientScrollView
        );
        await this.importP12Button.tap();
    };

    selectPatch = async () => {
        await waitForAndScrollDown(
            this.patchButton,
            this.testID.apiClientScrollView
        );
        await this.patchButton.tap();
    };

    selectPost = async () => {
        await waitForAndScrollDown(
            this.postButton,
            this.testID.apiClientScrollView
        );
        await this.postButton.tap();
    };

    selectPut = async () => {
        await waitForAndScrollDown(
            this.putButton,
            this.testID.apiClientScrollView
        );
        await this.putButton.tap();
    };

    selectUpload = async () => {
        await waitForAndScrollDown(
            this.uploadButton,
            this.testID.apiClientScrollView
        );
        await this.uploadButton.tap();
    };
}

const apiClientScreen = new ApiClientScreen();
export default apiClientScreen;
