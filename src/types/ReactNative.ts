// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type { NativeAPIClient } from "./NativeAPIClient";
import type { NativeGenericClient } from "./NativeGenericClient";
import type { NativeWebSocketClient } from "./NativeWebSocketClient";

export * from "react-native";
declare module "react-native" {
    export interface NativeModulesStatic {
        APIClient: NativeAPIClient;
        GenericClient: NativeGenericClient;
        WebSocketClient: NativeWebSocketClient;
    }
}
