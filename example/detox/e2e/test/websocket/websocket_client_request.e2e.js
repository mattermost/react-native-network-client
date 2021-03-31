// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { ClientListScreen, WebSocketClientScreen } from "@support/ui/screen";
import { verifyWebSocketEvent } from "../helpers";

describe("WebSocket Client Request", () => {
    const testName = "Simple WebSocket";
    const testMessageJson = {
        id: 123,
        action: "user_typing",
        data: {
            channel_id: "xyz123",
        },
    };
    const testMessage = JSON.stringify(testMessageJson);
    const {
        connectButton,
        disconnectButton,
        sendButton,
        setMessage,
    } = WebSocketClientScreen;

    beforeAll(async () => {
        await ClientListScreen.clientListScrollView.scrollTo("bottom");
        await WebSocketClientScreen.open(testName);
    });

    it("should be able to connect and send message", async () => {
        // # Connect to WebSocket server
        await connectButton.tap();

        // * Verify connected
        const connected = {
            message: "connected",
            url: "ws://localhost:3000/api/websocket",
        };
        verifyWebSocketEvent(connected);

        // # Send message
        await setMessage(testMessage);
        await sendButton.tap();

        // * Verify message sent
        const messageSent = {
            message: testMessageJson,
            url: "ws://localhost:3000/api/websocket",
        };
        verifyWebSocketEvent(messageSent);
    });

    it("should be able to disconnect", async () => {
        // # Disconnect from WebSocket server
        await disconnectButton.tap();

        // * Verify disconnected
        const disconnected = {
            url: "ws://localhost:3000/api/websocket",
        };
        verifyWebSocketEvent(disconnected);

        // # Open client list screen
        await WebSocketClientScreen.back();
    });
});
