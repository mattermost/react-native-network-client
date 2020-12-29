// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import ClientListScreen from "./screens/ClientListScreen";
import CreateAPIClientScreen from "./screens/CreateAPIClientScreen";
import CreateWebSocketClientScreen from "./screens/CreateWebSocketClientScreen";
import GenericClientRequestScreen from "./screens/GenericClientRequestScreen";
import APIClientScreen from "./screens/APIClientScreen";
import APIClientRequestScreen from "./screens/APIClientRequestScreen";
import APIClientUploadScreen from "./screens/APIClientUploadScreen";
import APIClientFastImageScreen from "./screens/APIClientFastImageScreen";
import MattermostClientUploadScreen from "./screens/MattermostClientUploadScreen";

const Stack = createStackNavigator();

function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="ClientListScreen">
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
                    name="APIClientFastImage"
                    component={APIClientFastImageScreen}
                />
                <Stack.Screen
                    name="MattermostClientUpload"
                    component={MattermostClientUploadScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
