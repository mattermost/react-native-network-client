// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { Alert } from "@support/ui/component";
import { waitForAndScrollDown } from "@support/utils";

class ClientListScreen {
    testID = {
        clientListScrollView: "client_list.scroll_view",
    };

    clientListScreen = element(by.text("ClientList"));
    clientListScrollView = element(by.id(this.testID.clientListScrollView));
    genericClientAction = element(by.text("Generic"));
    addApiClientButton = element(by.text("Add API Client"));
    addWebSocketClientButton = element(by.text("Add WebSocket Client"));

    toBeVisible = async () => {
        await expect(this.clientListScreen).toBeVisible();

        return this.clientListScreen;
    };

    removeClientWithName = async (name) => {
        const { okButton, removeClientTitle } = Alert;

        const item = element(by.text(name));
        await waitForAndScrollDown(item, this.testID.clientListScrollView);
        await item.longPress();
        await expect(removeClientTitle).toBeVisible();
        await okButton.tap();
    };
}

const clientListScreen = new ClientListScreen();
export default clientListScreen;
