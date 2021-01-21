// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState, useEffect } from "react";
import { FlatList, SafeAreaView } from "react-native";
import { ButtonGroup } from "react-native-elements";

import GenericClient from "@mattermost/react-native-network-client";

import ClientListItem from "../components/ClientListItem";
import { createTestClients, networkClientKeyExtractor } from "../utils";

export default function ClientListScreen({
    navigation,
    route,
}: ClientListScreenProps) {
    const [clients, setClients] = useState<NetworkClientItem[]>([
        { client: GenericClient, name: "Generic Client" },
    ]);

    useEffect(() => {
        if (clients.length === 1) {
            createTestClients().then((testClients) =>
                setClients([...clients, ...testClients])
            );
        }
    }, []);

    useEffect(() => {
        if (route.params?.createdClient) {
            setClients([...clients, route.params.createdClient]);
        }
    }, [route.params?.createdClient]);

    const deleteClient = (clientIndex: number) => {
        setClients(clients.filter((_, index) => clientIndex !== index));
    };

    const renderItem = ({
        item,
        index,
    }: {
        item: NetworkClientItem;
        index: number;
    }) => (
        <ClientListItem
            index={index}
            item={item}
            deleteClient={deleteClient}
            navigate={navigation.navigate}
        />
    );

    const buttons = [
        {
            title: "Add API Client",
            action: () => navigation.navigate("CreateAPIClient"),
        },
        {
            title: "Add WebSocket Client",
            action: () => navigation.navigate("CreateWebSocketClient"),
        },
    ];

    const onButtonPress = (index: number) => buttons[index].action();

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <FlatList
                data={clients}
                renderItem={renderItem}
                keyExtractor={networkClientKeyExtractor}
            />
            <ButtonGroup
                buttons={buttons.map((button) => button.title)}
                onPress={onButtonPress}
            />
        </SafeAreaView>
    );
}
