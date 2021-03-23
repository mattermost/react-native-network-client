// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Alert } from "react-native";
import { ListItem } from "react-native-elements";

import { ClientType } from "../utils";

type ClientListItemProps = {
    index: number;
    item: NetworkClientItem;
    deleteClient: (index: number) => void;
    navigate: (screen: string, {}: { item: NetworkClientItem }) => void;
};

const ClientListItem = (props: ClientListItemProps) => {
    const {
        index,
        deleteClient,
        item: { name, client, type },
    } = props;

    const viewClient = () => {
        let screen = "GenericClientRequest";
        if (type === ClientType.API) {
            screen = "APIClient";
        } else if (type === ClientType.WEBSOCKET) {
            screen = "WebSocketClient";
        }

        props.navigate(screen, { item: props.item });
    };

    const invalidateClient = () => {
        if ("invalidate" in client) {
            client.invalidate();
            deleteClient(index);
        }
    };

    const removeClient = () => {
        "invalidate" in client &&
            Alert.alert(
                "Remove Client",
                "",
                [{ text: "Cancel" }, { text: "OK", onPress: invalidateClient }],
                { cancelable: true }
            );
    };

    const Subtitle = () => {
        if ("baseUrl" in client) {
            return (
                <ListItem.Subtitle testID="client_list_item.subtitle">
                    {client.baseUrl}
                </ListItem.Subtitle>
            );
        } else if ("url" in client) {
            return (
                <ListItem.Subtitle testID="client_list_item.subtitle">
                    {client.url}
                </ListItem.Subtitle>
            );
        }

        return null;
    };

    return (
        <ListItem
            onPress={viewClient}
            onLongPress={removeClient}
            bottomDivider
            testID="client_list_item.item"
        >
            <ListItem.Content testID="client_list_item.content">
                <ListItem.Title testID="client_list_item.title">
                    {name}
                </ListItem.Title>
                <Subtitle />
            </ListItem.Content>
            <ListItem.Chevron testID="client_list_item.chevron" />
        </ListItem>
    );
};

export default ClientListItem;
