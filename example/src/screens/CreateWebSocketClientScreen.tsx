// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Button, CheckBox, Input } from "react-native-elements";

import { getOrCreateWebSocketClient } from "@mattermost/react-native-network-client";

import AddHeaders from "../components/AddHeaders";
import NumericInput from "../components/NumericInput";
import { ClientType, parseHeaders } from "../utils";

const styles = StyleSheet.create({
    checkboxText: { flex: 1 },
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
        sslPinningConfiguration: { enabled: false, allowSelfSigned: false },
    });

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

    const toggleEnableSSLPinning = () => {
        setConfiguration((configuration) => ({
            ...configuration,
            sslPinningConfiguration: {
                ...configuration.sslPinningConfiguration!,
                enabled: !configuration.sslPinningConfiguration!.enabled,
            },
        }));
    };

    const toggleAllowSelfSigned = () => {
        setConfiguration((configuration) => ({
            ...configuration,
            sslPinningConfiguration: {
                ...configuration.sslPinningConfiguration!,
                allowSelfSigned: !configuration.sslPinningConfiguration!
                    .allowSelfSigned,
            },
        }));
    };

    const createClient = async () => {
        try {
            const { client, created } = await getOrCreateWebSocketClient(
                url,
                configuration
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
                <Input label="Name" onChangeText={setName} />
                <Input
                    label="URL"
                    onChangeText={setUrl}
                    autoCapitalize="none"
                />

                <AddHeaders onHeadersChanged={setHeaders} />

                <NumericInput
                    title="Timeout Interval"
                    value={configuration.timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
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

                <CheckBox
                    title={`Enable SSL Pinning? ${configuration.sslPinningConfiguration!.enabled}`}
                    checked={configuration.sslPinningConfiguration!.enabled}
                    onPress={toggleEnableSSLPinning}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                {configuration.sslPinningConfiguration!.enabled && (
                    <CheckBox
                        title={`Allow Self Signed Certificates? ${configuration.sslPinningConfiguration!.allowSelfSigned!}`}
                        checked={
                            configuration.sslPinningConfiguration!
                                .allowSelfSigned!
                        }
                        onPress={toggleAllowSelfSigned}
                        iconType="ionicon"
                        checkedIcon="ios-checkmark-circle"
                        uncheckedIcon="ios-checkmark-circle"
                        iconRight
                        textStyle={styles.checkboxText}
                    />
                )}

                <Button
                    title="Create"
                    onPress={createClient}
                    disabled={!name || !url}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
