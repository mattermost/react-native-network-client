// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react';
import {Button, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import GenericClient from '@mattermost/react-native-network-client';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

type CreateNetworkClientScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateNetworkClient'
>;

type CreateNetworkClientScreenRouteProp = RouteProp< {params: {client?: Client} }, 'params'>;


type CreateNetworkClientScreenProps = {
  navigation: CreateNetworkClientScreenNavigationProp;
  route: CreateNetworkClientScreenRouteProp
};

type Client = {type: string, client: GenericClientInterface, name: string, baseUrl?: string, wsUrl?: string}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      padding: 10,
    },
    clientUrl: {
        flex: 2,
    },
    clientAction: {
        flex: 1,
        alignItems: 'flex-end',
    },
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
    }
  });


type NetworkClientProps = {name: string, client: Client, navigate: (screen: string, params: {name: string, client: Client} ) => void}
const NetworkClient = ({name, client, navigate}: NetworkClientProps) => {
    const viewClient = () => {
        const screen = client.baseUrl ? 'NetworkClient' : 'GenericClient';
        navigate(screen, {name, client});
    };

    return (
        <TouchableOpacity style={styles.row} onPress={viewClient}>
            <>
                <View style={styles.clientUrl}>
                    <Text>{name}</Text>
                    {
                    client.baseUrl &&
                    <Text>{client.baseUrl}</Text>
                    }
                </View>
                <View style={styles.clientAction}>
                    <Text>{'>'}</Text>
                </View>
            </>
        </TouchableOpacity>
    );
}

type WebSocketClientProps = {name: string, client: Client}
const WebSocketClient = ({name, client}: WebSocketClientProps) => (
    <View style={styles.row}>
        <View style={styles.clientUrl}>
            <Text>{name}</Text>
            <Text>{client.wsUrl}</Text>
        </View>
        <View style={styles.clientAction}>
            <Text>{'>'}</Text>
        </View>
    </View>
);

const ItemSeparator = () => (
    <View style={styles.separator} />
);

export default function CreateNetworkClientScreen({navigation, route}: CreateNetworkClientScreenProps) {
    const [clients, setClients] = useState<Client[]>([{type: 'network', client: GenericClient, name: 'Generic Client'}]);

    useEffect(() => {
        if (route.params?.client) {
            setClients([...clients, route.params.client]);
        }
    }, [route.params?.client]);

    const renderItem = ({item}: {item: Client}) => (
        item.type === 'network' ?
            <NetworkClient name={item.name} client={item} navigate={navigation.navigate} /> :
            <WebSocketClient name={item.name} client={item} />
    );

    const keyExtractor = (item: Client) => (item.baseUrl || item.wsUrl || item.name);

    const goToCreateNetworkClient = () => navigation.navigate('CreateNetworkClient');
    const goToCreateWebSocketClient = () => navigation.navigate('CreateWebSocketClient');

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={clients}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={ItemSeparator}
            />
            <View style={styles.buttonContainer}>
                <Button
                    title='Add Network Client'
                    onPress={goToCreateNetworkClient}
                />
                <Button
                    title='Add WebSocket Client'
                    onPress={goToCreateWebSocketClient}
                />
            </View>
        </SafeAreaView>
    );
}