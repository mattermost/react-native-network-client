// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    HeaderListItem,
    MethodButtons,
} from '@support/ui/component';

class ApiClientScreen {
    testID = {
        baseUrlInput: 'api_client.base_url.input',
        nameInput: 'api_client.name.input',
    }

    apiClientScreen = element(by.text('APIClient'));
    baseUrlInput = element(by.id(this.testID.baseUrlInput));
    nameInput = element(by.id(this.testID.nameInput));
    clientListButton = element(by.text('ClientList')).atIndex(0);
    fastImageButton = element(by.text('FAST IMAGE'));
    uploadButton = element(by.text('UPLOAD'));

    // convenience props
    getButton = MethodButtons.getButton;
    deleteButton = MethodButtons.deleteButton;
    patchButton = MethodButtons.patchButton;
    postButton = MethodButtons.postButton;
    putButton = MethodButtons.putButton;

    getHeaderListItemAtIndex = (index) => {
        return HeaderListItem.getItemAtIndex(index);
    }

    toBeVisible = async () => {
        await expect(this.apiClientScreen).toBeVisible();

        return this.apiClientScreen;
    }

    open = async (name) => {
        // # Open API client screen
        await element(by.text(name)).tap();

        return this.toBeVisible();
    }

    back = async () => {
        await this.clientListButton.tap();
        await expect(this.apiClientScreen).not.toBeVisible();
    }
}

const apiClientScreen = new ApiClientScreen();
export default apiClientScreen;
