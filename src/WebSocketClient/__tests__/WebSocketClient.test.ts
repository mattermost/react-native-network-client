// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { getOrCreateWebSocketClient } from "../index";
import NativeWebSocketClient from "../NativeWebSocketClient";

const mockNativeClient = NativeWebSocketClient as jest.Mocked<
    typeof NativeWebSocketClient
>;

jest.mock("../NativeWebSocketClient", () => ({
    __esModule: true,
    default: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
        ensureClientFor: jest.fn().mockResolvedValue(undefined),
        connectFor: jest.fn().mockResolvedValue(undefined),
        disconnectFor: jest.fn().mockResolvedValue(undefined),
        sendDataFor: jest.fn().mockResolvedValue(undefined),
        sendBinaryDataFor: jest.fn().mockResolvedValue(undefined),
        invalidateClientFor: jest.fn().mockResolvedValue(undefined),
    },
    WebSocketReadyState: { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 },
    WebSocketEvents: {
        OPEN_EVENT: "WebSocketClient-Open",
        CLOSE_EVENT: "WebSocketClient-Close",
        ERROR_EVENT: "WebSocketClient-Error",
        MESSAGE_EVENT: "WebSocketClient-Message",
        READY_STATE_EVENT: "WebSocketClient-ReadyState",
    },
}));

// Each test uses a unique URL to avoid the module-level CLIENTS singleton state.
let urlCounter = 0;
const nextUrl = () =>
    `ws://mattermost.example.com/api/v4/websocket?t=${++urlCounter}`;

describe("WebSocketClient", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should call sendDataFor when send() is invoked", async () => {
        const url = nextUrl();
        const { client } = await getOrCreateWebSocketClient(url);

        client.send("hello");

        expect(mockNativeClient.sendDataFor).toHaveBeenCalledWith(url, "hello");
    });

    it("should call sendBinaryDataFor when sendBinary() is invoked", async () => {
        const url = nextUrl();
        const { client } = await getOrCreateWebSocketClient(url);
        const base64Data = "SGVsbG8gV29ybGQ=";

        client.sendBinary(base64Data);

        expect(mockNativeClient.sendBinaryDataFor).toHaveBeenCalledWith(
            url,
            base64Data,
        );
    });

    it("should pass the exact url and data to sendBinaryDataFor", async () => {
        const url = nextUrl();
        const { client } = await getOrCreateWebSocketClient(url);
        const encoded = "dGVzdA==";

        client.sendBinary(encoded);

        expect(mockNativeClient.sendBinaryDataFor).toHaveBeenCalledTimes(1);
        expect(mockNativeClient.sendBinaryDataFor).toHaveBeenCalledWith(
            url,
            encoded,
        );
    });
});
