// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react';
import {
    Alert,
    Button,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import GenericClient from '@mattermost/react-native-network-client';
import type { Client, ClientListScreenProps } from 'example/@types/navigation';

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

type NetworkClientProps = {name: string, index: number, client: Client["client"], deleteClient: (index: number) => void, navigate: (screen: string, {}: {name: string, client: Client["client"]}) => void}
const NetworkClient = ({name, index, client, deleteClient, navigate}: NetworkClientProps) => {
const viewClient = () => {
        const screen = 'baseUrl' in client ? 'APIClient' : 'GenericClient';
        navigate(screen, {name, client});
    };

    const invalidateClient = () => {
        if('baseUrl' in client){
            client.invalidate!();
            deleteClient(index);
        }
    }

    const removeClient = () => {
        'baseUrl' in client &&
        Alert.alert(
            'Remove Client',
            '',
            [{text: 'Cancel'}, {text: 'OK', onPress: invalidateClient}],
            {cancelable: true}
        );
    }

    return (
        <TouchableOpacity style={styles.row} onPress={viewClient} onLongPress={removeClient}>
            <>
                <View style={styles.clientUrl}>
                    <Text>{name}</Text>
                    {
                    'baseUrl' in client &&
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

export default function ClientListScreen({navigation, route}: ClientListScreenProps) {
    const [clients, setClients] = useState<Client[]>([{type: 'network', client: GenericClient, name: 'Generic Client'}]);

    useEffect(() => {
        if (route.params?.client) {
            setClients([...clients, route.params.client]);
        }
    }, [route.params?.client]);
    
    const deleteClient = (clientIndex: number) => {
        setClients(clients.filter((_, index) => clientIndex !== index));
    }

    const renderItem = ({item, index}: {item: Client, index: number}) => (
        item.type === 'network' ?
            <NetworkClient name={item.name} index={index} client={item.client} deleteClient={deleteClient} navigate={navigation.navigate} /> :
            <WebSocketClient name={item.name} client={item} />
    );

    const keyExtractor = (item: Client) => (item.baseUrl || item.wsUrl || item.name);

    const goToCreateAPIClient = () => navigation.navigate('CreateAPIClient');
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
                    title='Add API Client'
                    onPress={goToCreateAPIClient}
                />
                <Button
                    title='Add WebSocket Client'
                    onPress={goToCreateWebSocketClient}
                />
            </View>
        </SafeAreaView>
    );
}