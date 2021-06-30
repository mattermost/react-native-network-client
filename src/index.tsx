// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";

import GenericClient from "./GenericClient";
import { getOrCreateAPIClient } from "./APIClient";
import { getOrCreateWebSocketClient } from "./WebSocketClient";

const { APIClient: NativeAPIClient } = NativeModules;

const Constants = NativeAPIClient.getConstants();

export * from "./types/APIClient";
export * from "./types/NativeAPIClient";
export * from "./types/NativeGenericClient";
export * from "./types/NativeWebSocketClient";
export * from "./types/WebSocketClient";
export { getOrCreateAPIClient, getOrCreateWebSocketClient, Constants };
export default GenericClient;
