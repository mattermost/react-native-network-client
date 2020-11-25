// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";
import GenericClient from "./GenericClient";
import { getOrCreateAPIClient } from "./APIClient";
import { getOrCreateWebSocketClient } from "./WebSocketClient";

const { RNNCConstants: Constants } = NativeModules;

export default GenericClient;
export { getOrCreateAPIClient, getOrCreateWebSocketClient, Constants };
