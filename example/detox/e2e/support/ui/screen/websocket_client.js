// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { ClientListItem } from "@support/ui/component";
import { ClientListScreen } from "@support/ui/screen";
import { isAndroid, waitForAndScrollDown } from "@support/utils";

class WebSocketClientScreen {
    testID = {
        messageInput: "websocket_client.message.input",
        eventText: "websocket_client.event.text",
    };

    webSocketClientScreen = element(by.text("WebSocketClient"));
    messageInput = element(by.id(this.testID.messageInput));
    eventText = element(by.id(this.testID.eventText));
    clientListButton = element(by.text("ClientList")).atIndex(0);
    connectButton = element(by.text("Connect"));
    disconnectButton = element(by.text("Disconnect"));
    sendButton = element(by.text("Send"));

    toBeVisible = async () => {
        await expect(this.webSocketClientScreen).toBeVisible();

        return this.webSocketClientScreen;
    };

    open = async (name) => {
        // # Open WebSocket client screen
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
        await expect(this.webSocketClientScreen).not.toBeVisible();
    };

    setMessage = async (message) => {
        await this.messageInput.clearText();
        await this.messageInput.replaceText(message);
    };
}

const webSocketClientScreen = new WebSocketClientScreen();
export default webSocketClientScreen;
