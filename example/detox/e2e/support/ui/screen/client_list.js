// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Alert} from '@support/ui/component';

class ClientListScreen {
    clientListScreen = element(by.text('ClientList'));
    genericClientAction = element(by.text('Generic'));
    addApiClientButton = element(by.text('Add API Client'));
    addWebSocketClientButton = element(by.text('Add WebSocket Client'));
    
    toBeVisible = async () => {
        await expect(this.clientListScreen).toBeVisible();

        return this.clientListScreen;
    }

    removeClientWithName = async (name) => {
        const {
            okButton,
            removeClientTitle,
        } = Alert;

        await element(by.text(name)).longPress();
        await expect(removeClientTitle).toBeVisible();
        await okButton.tap();
    }
}

const clientListScreen = new ClientListScreen();
export default clientListScreen;
