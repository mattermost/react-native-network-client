// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import "react-native-gesture-handler";
import { AppRegistry, LogBox } from "react-native";
import App from "./src/App";
import { name as appName } from "./app.json";

if (__DEV__) {
    LogBox.ignoreLogs(["Non-serializable values were found in the navigation state. Check:"]);
}

AppRegistry.registerComponent(appName, () => App);
