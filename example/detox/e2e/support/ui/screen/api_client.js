// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    ClientListItem,
    HeaderListItem,
    MethodButtons,
} from '@support/ui/component';
import {
    isAndroid,
    timeouts,
    wait,
} from '@support/utils'

class ApiClientScreen {
    testID = {
        apiClientScrollView: 'api_client.scroll_view',
        baseUrlInput: 'api_client.base_url.input',
        nameInput: 'api_client.name.input',
    }

    apiClientScreen = element(by.text('APIClient'));
    apiClientScrollView = element(by.id(this.testID.apiClientScrollView));
    baseUrlInput = element(by.id(this.testID.baseUrlInput));
    nameInput = element(by.id(this.testID.nameInput));
    clientListButton = element(by.text('ClientList')).atIndex(0);
    fastImageButton = element(by.text('FAST IMAGE'));
    uploadButton = element(by.text('UPLOAD'));

    // convenience props
    deleteButton = MethodButtons.deleteButton;
    getButton = MethodButtons.getButton;
    patchButton = MethodButtons.patchButton;
    postButton = MethodButtons.postButton;
    putButton = MethodButtons.putButton;

    getHeaderListItemAtIndex = (index) => {
        return HeaderListItem.getListHeadersItemAtIndex(index);
    }

    toBeVisible = async () => {
        await expect(this.apiClientScreen).toBeVisible();

        return this.apiClientScreen;
    }

    open = async (name) => {
        // # Open API client screen
        const {item} = ClientListItem.getItemByName(name);
        await wait(timeouts.TWO_SEC);
        await item.tap();

        return this.toBeVisible();
    }

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.clientListButton.tap();
        }
        await expect(this.apiClientScreen).not.toBeVisible();
    }

    selectDelete = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.deleteButton.tap();
    }

    selectGet = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.getButton.tap();
    }

    selectFastImage = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.fastImageButton.tap();
    }

    selectPatch = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.patchButton.tap();
    }

    selectPost = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.postButton.tap();
    }

    selectPut = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.putButton.tap();
    }

    selectUpload = async () => {
        await this.apiClientScrollView.scrollTo('bottom');
        await this.uploadButton.tap();
    }
}

const apiClientScreen = new ApiClientScreen();
export default apiClientScreen;
