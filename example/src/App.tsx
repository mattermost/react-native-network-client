// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import {LogBox} from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import ClientListScreen from "./screens/ClientListScreen";
import CreateAPIClientScreen from "./screens/CreateAPIClientScreen";
import CreateWebSocketClientScreen from "./screens/CreateWebSocketClientScreen";
import GenericClientRequestScreen from "./screens/GenericClientRequestScreen";
import APIClientScreen from "./screens/APIClientScreen";
import APIClientRequestScreen from "./screens/APIClientRequestScreen";
import APIClientUploadScreen from "./screens/APIClientUploadScreen";
import APIClientDownloadScreen from "./screens/APIClientDownloadScreen";
import APIClientFastImageScreen from "./screens/APIClientFastImageScreen";
import APIClientImportP12Screen from "./screens/APIClientImportP12Screen";
import MattermostClientUploadScreen from "./screens/MattermostClientUploadScreen";
import WebSocketClientScreen from "./screens/WebSocketClientScreen";

if (__DEV__) {
    LogBox.ignoreLogs(["Require cycle: ../node_modules/zod/lib/src/index.js"]);
}

const Stack = createStackNavigator();

function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="ClientList">
                <Stack.Screen name="ClientList" component={ClientListScreen} />
                <Stack.Screen
                    name="CreateAPIClient"
                    component={CreateAPIClientScreen}
                />
                <Stack.Screen
                    name="CreateWebSocketClient"
                    component={CreateWebSocketClientScreen}
                />
                <Stack.Screen
                    name="GenericClientRequest"
                    component={GenericClientRequestScreen}
                />
                <Stack.Screen name="APIClient" component={APIClientScreen} />
                <Stack.Screen
                    name="APIClientRequest"
                    component={APIClientRequestScreen}
                />
                <Stack.Screen
                    name="APIClientUpload"
                    component={APIClientUploadScreen}
                />
                <Stack.Screen
                    name="APIClientDownload"
                    component={APIClientDownloadScreen}
                />
                <Stack.Screen
                    name="APIClientFastImage"
                    component={APIClientFastImageScreen}
                />
                <Stack.Screen
                    name="APIClientImportP12"
                    component={APIClientImportP12Screen}
                />
                <Stack.Screen
                    name="MattermostClientUpload"
                    component={MattermostClientUploadScreen}
                />
                <Stack.Screen
                    name="WebSocketClient"
                    component={WebSocketClientScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
