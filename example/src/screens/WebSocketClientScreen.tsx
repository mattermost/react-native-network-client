// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { Button, Input } from "react-native-elements";
import Markdown from "react-native-markdown-renderer";

export default function WebSocketClientScreen({
    route,
}: WebSocketClientScreenProps) {
    const {
        item: { client },
    } = route.params;

    const [connected, setConnected] = useState(true);
    // const [message, setMessage] = useState(
    //     JSON.stringify({
    //         seq: 1,
    //         action: "authentication_challenge",
    //         data: { token: "th4yekcb8pgo7x5crgrqzcsmwy" },
    //     })
    // );
    const [message, setMessage] = useState(
        JSON.stringify({
            seq: 1,
            action: "user_typing",
            data: { channel_id: "4dtzmswn93f68fkd97eeafm6xc" },
        })
    );
    const [event, setEvent] = useState<string>();

    useEffect(() => {
        client.connect();

        client.onOpen((event) => {
            setConnected(true);
            parseAndSetEvent(event);
        });
        client.onClose((event) => {
            setConnected(false);
            parseAndSetEvent(event);
        });
        client.onError((event) => {
            parseAndSetEvent(event);
        });
        client.onMessage((event) => {
            parseAndSetEvent(event);
        });
    }, []);

    const parseAndSetEvent = (event: WebSocketEvent) => {
        setEvent("```\n" + JSON.stringify(event, null, 2) + "\n```");
    };

    const send = () => {
        client.send(message);
    };

    const ActionButton = () => (
        <>
            <Button
                title="Send"
                onPress={send}
                style={{ padding: 10 }}
                disabled={!Boolean(message) || !connected}
            />
            <Button
                title="Connect"
                onPress={client.connect}
                style={{ padding: 10 }}
                disabled={connected}
            />
            <Button
                title="Disconnect"
                onPress={client.close}
                style={{ padding: 10 }}
                disabled={!connected}
            />
        </>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View>
                <Text>{connected ? "Connected" : "Disconnected"}</Text>
            </View>
            <Input
                label="Message"
                multiline={true}
                numberOfLines={10}
                placeholder={JSON.stringify({
                    action: "",
                    seq: 2,
                    data: { channel_id: "" },
                })}
                onChangeText={setMessage}
                value={message}
            />
            <ActionButton />
            <Text>Received:</Text>
            <Markdown>{event}</Markdown>
        </SafeAreaView>
    );
}
