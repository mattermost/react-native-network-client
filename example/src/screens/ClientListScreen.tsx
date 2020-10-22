// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react';
import {Button, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import GenericClient from 'react-native-network-client';

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

const NetworkClient = ({name, client, navigate}) => {
    const viewClient = () => {
        const screen = client.rootUrl ? 'NetworkClient' : 'GenericClient';
        navigate(screen, {name, client});
    };

    return (
        <TouchableOpacity style={styles.row} onPress={viewClient}>
            <>
                <View style={styles.clientUrl}>
                    <Text>{name}</Text>
                    {
                    client.rootUrl &&
                    <Text>{client.rootUrl}</Text>
                    }
                </View>
                <View style={styles.clientAction}>
                    <Text>{'>'}</Text>
                </View>
            </>
        </TouchableOpacity>
    );
}

const WebSocketClient = ({name, client}) => (
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

export default function CreateNetworkClientScreen({navigation, route}) {
    const [clients, setClients] = useState([{type: 'network', client: GenericClient, name: 'Generic Client'}]);

    useEffect(() => {
        if (route.params?.client) {
            setClients([...clients, route.params.client]);
        }
    }, [route.params?.client]);

    const renderItem = ({item}) => (
        item.type === 'network' ?
            <NetworkClient name={item.name} client={item.client} navigate={navigation.navigate} /> :
            <WebSocketClient name={item.name} client={item.client} />
    );

    const keyExtractor = (item) => (item.rootUrl || item.wsUrl || item.name);

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