// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ClientListScreen from './screens/ClientListScreen';
import CreateNetworkClientScreen from './screens/CreateNetworkClientScreen';
import CreateWebSocketClientScreen from './screens/CreateWebSocketClientScreen';
import GenericClientScreen from './screens/GenericClientScreen';
import NetworkClientScreen from './screens/NetworkClientScreen';

const Stack = createStackNavigator();

function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='ClientListScreen'>
                <Stack.Screen name='ClientList' component={ClientListScreen} />
                <Stack.Screen name='CreateNetworkClient' component={CreateNetworkClientScreen} />
                <Stack.Screen name='CreateWebSocketClient' component={CreateWebSocketClientScreen} />
                <Stack.Screen name='GenericClient' component={GenericClientScreen} />
                <Stack.Screen name='NetworkClient' component={NetworkClientScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;