// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { Button } from "react-native-elements";

import P12Inputs from "../components/P12Inputs";
import { useClientP12Configuration } from "../hooks";

const styles = StyleSheet.create({
    importButton: { padding: 10 },
});

const APIClientImportP12Screen = ({
    route,
    navigation,
}: APIClientImportP12ScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [
        clientP12Configuration,
        setClientP12Path,
        setClientP12Password,
    ] = useClientP12Configuration();

    const [error, setError] = useState<ClientResponseError>();

    const importClientP12 = () => {
        const { path, password } = clientP12Configuration;
        try {
            client.importClientP12(path, password);
        } catch (e) {
            setError(e);
            return;
        }

        setError(undefined);
        navigation.goBack();
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
            {error && (
                <Text>{`Error\nCode: ${error.code}\nMessage: ${error.message}`}</Text>
            )}
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
