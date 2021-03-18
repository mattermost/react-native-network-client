// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Button, CheckBox, Input } from "react-native-elements";

import { getOrCreateWebSocketClient } from "@mattermost/react-native-network-client";

import AddHeaders from "../components/AddHeaders";
import P12Inputs from "../components/P12Inputs";
import NumericInput from "../components/NumericInput";
import { useClientP12Configuration } from "../hooks";
import { ClientType, parseHeaders } from "../utils";

const styles = StyleSheet.create({
    checkboxText: { flex: 1 },
    createButton: { padding: 10 },
});

export default function CreateWebSocketClientScreen({
    navigation,
}: CreateWebSocketClientScreenProps) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [
        configuration,
        setConfiguration,
    ] = useState<WebSocketClientConfiguration>({
        timeoutInterval: 5,
        enableCompression: false,
    });
    const [
        clientP12Configuration,
        setClientP12Path,
        setClientP12Password,
    ] = useClientP12Configuration();

    const setHeaders = (headers: Header[]) => {
        setConfiguration((configuration) => ({
            ...configuration,
            headers: parseHeaders(headers),
        }));
    };

    const setTimeoutInterval = (timeoutInterval: number) => {
        setConfiguration((configuration) => ({
            ...configuration,
            timeoutInterval,
        }));
    };

    const toggleEnableCompression = () => {
        setConfiguration((configuration) => ({
            ...configuration,
            enableCompression: !configuration.enableCompression,
        }));
    };

    const createClient = async () => {
        const wsConfiguration = {
            ...configuration,
        };
        if (clientP12Configuration.path) {
            wsConfiguration["clientP12Configuration"] = clientP12Configuration;
        }

        try {
            const { client, created } = await getOrCreateWebSocketClient(
                url,
                wsConfiguration
            );

            if (!created) {
                Alert.alert(
                    "Error",
                    `A client for ${url} already exists`,
                    [{ text: "OK" }],
                    { cancelable: false }
                );
                return;
            }
            const createdClient: WebSocketClientItem = {
                name,
                client,
                type: ClientType.WEBSOCKET,
            };

            navigation.navigate("ClientList", { createdClient });
        } catch (error) {
            Alert.alert("Error", error.message, [{ text: "OK" }], {
                cancelable: false,
            });
        }
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <Input
                    label="Name"
                    onChangeText={setName}
                    testID="create_web_socket_client.name.input"
                />
                <Input
                    label="URL"
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    testID="create_web_socket_client.url.input"
                />

                <AddHeaders onHeadersChanged={setHeaders} />

                <P12Inputs
                    title="Client PKCS12"
                    path={clientP12Configuration.path}
                    password={clientP12Configuration.password}
                    onSelectP12={setClientP12Path}
                    onPasswordChange={setClientP12Password}
                />

                <NumericInput
                    title="Timeout Interval"
                    value={configuration.timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
                    testID="create_web_socket_client.timeout_interval.input"
                />

                <CheckBox
                    title={`Enable Compression? ${configuration.enableCompression!}`}
                    checked={configuration.enableCompression!}
                    onPress={toggleEnableCompression}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <Button
                    title="Create"
                    onPress={createClient}
                    disabled={!name || !url}
                    style={styles.createButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
