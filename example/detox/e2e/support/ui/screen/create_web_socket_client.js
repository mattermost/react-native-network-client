// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ClientListScreen} from '@support/ui/screen';

class CreateWebSocketClientScreen {
    createWebSocketClientScreen = element(by.text('CreateWebSocketClient'));
    clientListButton = element(by.text('ClientList')).atIndex(0);
    createButton = element(by.text('Create'));

    toBeVisible = async () => {
        await expect(this.createWebSocketClientScreen).toBeVisible();

        return this.createWebSocketClientScreen;
    }

    open = async () => {
        // # Open create web socket client screen
        await ClientListScreen.addWebSocketClientButton.tap();

        return this.toBeVisible();
    }

    back = async () => {
        await this.clientListButton.tap();
        await expect(this.createWebSocketClientScreen).not.toBeVisible();
    }
}

const createWebSocketClientScreen = new CreateWebSocketClientScreen();
export default createWebSocketClientScreen;
