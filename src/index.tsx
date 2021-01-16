// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import GenericClient from "./GenericClient";
import { getOrCreateAPIClient } from "./APIClient";
import { getOrCreateWebSocketClient } from "./WebSocketClient";
import { NativeModules } from "react-native";

const { APIClient: NativeAPIClient } = NativeModules;

const Constants = NativeAPIClient.getConstants();

export default GenericClient;
export { getOrCreateAPIClient, getOrCreateWebSocketClient, Constants };
