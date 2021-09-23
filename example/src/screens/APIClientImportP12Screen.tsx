// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { Button } from "react-native-elements";

import P12Inputs from "../components/P12Inputs";
import { useClientP12Configuration } from "../hooks";

import type { ClientResponseError } from "@mattermost/react-native-network-client";

const styles = StyleSheet.create({
    importButton: { padding: 10 },
});

const APIClientImportP12Screen = ({ route }: APIClientImportP12ScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [
        clientP12Configuration,
        setClientP12Path,
        setClientP12Password,
    ] = useClientP12Configuration();

    const [error, setError] = useState<ClientResponseError>();
    const [success, setSuccess] = useState<boolean>(false);

    const importClientP12 = async () => {
        const { path, password } = clientP12Configuration;
        setError(undefined);

        try {
            await client.importClientP12(path, password);
            setSuccess(true);
        } catch (e) {
            setError(e as ClientResponseError);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <P12Inputs
                title="Client PKCS12"
                path={clientP12Configuration.path}
                password={clientP12Configuration.password}
                onSelectP12={setClientP12Path}
                onPasswordChange={setClientP12Password}
            />
            {error && <Text>{`Success\nMessage: ${error.message}`}</Text>}
            {success && <Text>Message: Identity has been imported</Text>}
            <Button
                title="Import"
                onPress={importClientP12}
                disabled={!clientP12Configuration.path}
                style={styles.importButton}
            />
        </SafeAreaView>
    );
};

export default APIClientImportP12Screen;
