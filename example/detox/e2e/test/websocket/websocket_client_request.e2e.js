// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import { secureWebSocketServerClientCertUrl } from "@support/test_config";
import { WebSocketClientScreen } from "@support/ui/screen";
import { verifyWebSocketEvent } from "../helpers";

describe("WebSocket Client Request", () => {
    const testName = "Simple WebSocket";
    const testWebSocketUrl = "ws://localhost:3000/api/websocket";
    const testSecureName = "Secure Simple WebSocket";
    const testSecureWebSocketUrl = "wss://localhost:4000/api/websocket";
    const testMessageJson = {
        id: 123,
        action: "user_typing",
        data: {
            channel_id: "xyz123",
        },
    };
    const testMessage = JSON.stringify(testMessageJson);

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it("should be able to connect, send message, and disconnect", async () => {
        // # Open client
        await WebSocketClientScreen.open(testName);

        // # Connect to WebSocket server
        await connectSendMessageAndDisconnect(
            testWebSocketUrl,
            testMessage,
            testMessageJson
        );
    });

    xit("should be able to connect, send message, and disconnect - secure connection", async () => { // Disabled due to https://mattermost.atlassian.net/browse/MM-34374
        // # Open client
        await WebSocketClientScreen.open(testSecureName);

        // # Connect to WebSocket server
        await connectSendMessageAndDisconnect(
            testSecureWebSocketUrl,
            testMessage,
            testMessageJson
        );
    });
});

async function connectSendMessageAndDisconnect(
    testWebSocketUrl,
    testMessage,
    testMessageJson
) {
    const {
        connectButton,
        disconnectButton,
        sendButton,
        setMessage,
    } = WebSocketClientScreen;
    // # Connect to WebSocket server
    await connectButton.tap();

    // * Verify connected
    const connected = {
        message: "connected",
        url: testWebSocketUrl,
    };
    verifyWebSocketEvent(connected);

    // # Send message
    await setMessage(testMessage);
    await sendButton.tap();

    // * Verify message sent
    const messageSent = {
        message: testMessageJson,
        url: testWebSocketUrl,
    };
    verifyWebSocketEvent(messageSent);

    // # Disconnect from WebSocket server
    await disconnectButton.tap();

    // * Verify disconnected
    const disconnected = {
        url: testWebSocketUrl,
    };
    verifyWebSocketEvent(disconnected);

    // # Open client list screen
    await WebSocketClientScreen.back();
}
