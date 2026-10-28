// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeEventEmitter } from "react-native";

import { addSessionAttributesNetworkChangeListener } from "../index";

jest.mock("../../APIClient/NativeApiClient", () => ({
    __esModule: true,
    default: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
    },
    ApiClientEvents: {
        SESSION_ATTRIBUTES_NETWORK_CHANGED:
            "ApiClient-SessionAttributesNetworkChanged",
    },
}));

describe("addSessionAttributesNetworkChangeListener", () => {
    it("should pass the reset server URLs to the listener", () => {
        const addListener = jest.spyOn(
            NativeEventEmitter.prototype,
            "addListener",
        );
        const listener = jest.fn();

        addSessionAttributesNetworkChangeListener(listener);

        expect(addListener).toHaveBeenCalledWith(
            "ApiClient-SessionAttributesNetworkChanged",
            expect.any(Function),
        );
        const handler = addListener.mock.calls[0][1];
        handler({ serverUrls: ["https://one.example.com"] });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(["https://one.example.com"]);
    });
});
