// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ClientListScreen from './screens/ClientListScreen';
import CreateAPIClientScreen from './screens/CreateAPIClientScreen';
import CreateWebSocketClientScreen from './screens/CreateWebSocketClientScreen';
import GenericClientScreen from './screens/GenericClientScreen';
import APIClientScreen from './screens/APIClientScreen';

const Stack = createStackNavigator();

function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='ClientListScreen'>
                <Stack.Screen name='ClientList' component={ClientListScreen} />
                <Stack.Screen name='CreateAPIClient' component={CreateAPIClientScreen} />
                <Stack.Screen name='CreateWebSocketClient' component={CreateWebSocketClientScreen} />
                <Stack.Screen name='GenericClient' component={GenericClientScreen} />
                <Stack.Screen name='APIClient' component={APIClientScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;