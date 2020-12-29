// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { ListItem } from "react-native-elements";

type ClientListItemProps = {
    index: number;
    item: NetworkClientItem;
    deleteClient: (index: number) => void;
    navigate: (screen: string, {}: { item: NetworkClientItem }) => void;
};

const ClientListItem = ({
    index,
    item,
    deleteClient,
    navigate,
}: ClientListItemProps) => {
    const { name, client } = item;
    const [url, setUrl] = useState("");
    const [screen, setScreen] = useState("");

    useEffect(() => {
        if ("baseUrl" in client) {
            setUrl(client.baseUrl);
            setScreen("APIClient");
        } else if ("wsUrl" in client) {
            setUrl(client.wsUrl);
            setScreen("WebSocketClient");
        } else {
            setScreen("GenericClientRequest");
        }
    }, []);

    const viewClient = () => navigate(screen, { item });

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

    return (
        <ListItem onPress={viewClient} onLongPress={removeClient} bottomDivider>
            <ListItem.Content>
                <ListItem.Title>{name}</ListItem.Title>
                {Boolean(url) && <ListItem.Subtitle>{url}</ListItem.Subtitle>}
            </ListItem.Content>
            <ListItem.Chevron />
        </ListItem>
    );
};

export default ClientListItem;
