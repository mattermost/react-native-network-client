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
import {
    ClientType,
    parseHeaders,
    webSocketClientErrorEventHandler,
} from "../utils";

import type { WebSocketClientConfiguration } from "@mattermost/react-native-network-client";

const styles = StyleSheet.create({
    checkboxText: { flex: 1 },
    createButton: { padding: 10 },
});

export default function CreateWebSocketClientScreen({
    navigation,
}: CreateWebSocketClientScreenProps) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [alertOnClientError, setAlertOnClientError] = useState(true);
    const toggleAlertOnClientError = () =>
        setAlertOnClientError((alertOnClientError) => !alertOnClientError);

    const [
        configuration,
        setConfiguration,
    ] = useState<WebSocketClientConfiguration>({
        timeoutInterval: 5000,
        enableCompression: false,
        trustSelfSignedServerCertificate: false,
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

    const toggleTrustSelfSignedServerCertificate = () => {
        setConfiguration((configuration) => ({
            ...configuration,
            trustSelfSignedServerCertificate: !configuration.trustSelfSignedServerCertificate,
        }));
    };

    const createClient = async () => {
        const wsConfiguration = {
            ...configuration,
        };
        if (clientP12Configuration.path) {
            wsConfiguration["clientP12Configuration"] = clientP12Configuration;
        }

        const clientErrorEventHandler = alertOnClientError
            ? webSocketClientErrorEventHandler
            : undefined;

        try {
            const { client, created } = await getOrCreateWebSocketClient(
                url,
                wsConfiguration,
                clientErrorEventHandler
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
        } catch (e) {
            const error = e as Error;
            Alert.alert("Error", error.message, [{ text: "OK" }], {
                cancelable: false,
            });
        }
    };

    return (
        <SafeAreaView>
            <ScrollView testID="create_websocket_client.scroll_view">
                <Input
                    autoCompleteType={undefined}
                    label="Name"
                    onChangeText={setName}
                    testID="create_websocket_client.name.input"
                />
                <Input
                    autoCompleteType={undefined}
                    label="URL"
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    testID="create_websocket_client.url.input"
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
                    title="Timeout Interval (ms)"
                    value={configuration.timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
                    step={5000}
                    testID="create_websocket_client.timeout_interval.input"
                />

                <CheckBox
                    title={`Alert on client error? [${alertOnClientError}]`}
                    checked={alertOnClientError}
                    onPress={toggleAlertOnClientError}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <CheckBox
                    title={`Enable Compression? [${configuration.enableCompression!}]`}
                    checked={configuration.enableCompression!}
                    onPress={toggleEnableCompression}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <CheckBox
                    title={`Trust Self-Signed Server Certificate? [${configuration.trustSelfSignedServerCertificate}]`}
                    checked={
                        configuration.trustSelfSignedServerCertificate as boolean
                    }
                    onPress={toggleTrustSelfSignedServerCertificate}
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
