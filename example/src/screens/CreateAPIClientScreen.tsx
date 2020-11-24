// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState, useRef, useEffect } from "react";
import {
    Alert,
    Button,
    Platform,
    PlatformColor,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import CheckBox from "@react-native-community/checkbox";
import DeviceInfo from "react-native-device-info";
import { getOrCreateAPIClient } from "@mattermost/react-native-network-client";
import type { CreateAPIClientScreenProps } from "example/@types/navigation";

const styles = StyleSheet.create({
    scrollViewContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
    },
    textInputContainer: {
        flex: 5,
    },
    numericInputContainer: {
        flex: 0.5,
    },
    label: {
        padding: 5,
        flex: 1,
    },
    input: {
        margin: 15,
        height: 40,
        borderWidth: 1,
        padding: 5,
        ...Platform.select({
            ios: { borderColor: PlatformColor("link") },
            android: {
                // borderColor: PlatformColor("?attr/colorControlNormal"),
            },
        }),
    },
    headersLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    headersContainer: {
        flex: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-evenly",
    },
});

type ClientHeaderProps = {
    index: number;
    header: { key: string; value: string };
    updateHeader: (
        index: number,
        header: { key: string; value: string }
    ) => void;
};
const ClientHeader = ({ index, header, updateHeader }: ClientHeaderProps) => {
    const [key, setKey] = useState(header.key);
    const [value, setValue] = useState(header.value);

    const doUpdateHeader = () => {
        updateHeader(index, { key, value });
    };

    return (
        <>
            <TextInput
                value={key}
                onChangeText={setKey}
                placeholder="key"
                autoCapitalize="none"
                onBlur={doUpdateHeader}
                style={[styles.input, { flex: 1 }]}
            />
            <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="value"
                autoCapitalize="none"
                onBlur={doUpdateHeader}
                style={[styles.input, { flex: 1 }]}
            />
        </>
    );
};

export default function CreateAPIClientScreen({
    navigation,
}: CreateAPIClientScreenProps) {
    const [name, setName] = useState("HTTP Google Redirect Test");
    const [baseUrl, setbaseUrl] = useState("http://google.com");
    const [clientHeaders, setClientHeaders] = useState<
        { key: string; value: string }[]
    >([]);
    const [sessionOptions, setSessionOptions] = useState<
        APIClientConfiguration
    >({
        followRedirects: true,
        allowsCellularAccess: true,
        waitsForConnectivity: false,
        timeoutIntervalForRequest: 30,
        timeoutIntervalForResource: 30,
        httpMaximumConnectionsPerHost: 10,
    });
    const scrollView = useRef<ScrollView>(null);

    const setFollowRedirects = (followRedirects: boolean) =>
        setSessionOptions({ ...sessionOptions, followRedirects });
    const setAllowsCellularAccess = (allowsCellularAccess: boolean) =>
        setSessionOptions({ ...sessionOptions, allowsCellularAccess });
    const setWaitsForConnectivity = (waitsForConnectivity: boolean) =>
        setSessionOptions({ ...sessionOptions, waitsForConnectivity });
    const setTimeoutIntervalForRequest = (timeoutIntervalForRequest: string) =>
        setSessionOptions({
            ...sessionOptions,
            timeoutIntervalForRequest: parseInt(timeoutIntervalForRequest),
        });
    const setTimeoutIntervalForResource = (
        timeoutIntervalForResource: string
    ) =>
        setSessionOptions({
            ...sessionOptions,
            timeoutIntervalForResource: parseInt(timeoutIntervalForResource),
        });
    const setHttpMaximumConnectionsPerHost = (
        httpMaximumConnectionsPerHost: string
    ) =>
        setSessionOptions({
            ...sessionOptions,
            httpMaximumConnectionsPerHost: parseInt(
                httpMaximumConnectionsPerHost
            ),
        });

    // TEST MM default headers
    const addDefaultHeaders = async () => {
        const userAgent = await DeviceInfo.getUserAgent();
        setClientHeaders([
            { key: "X-Requested-With", value: "XMLHttpRequest" },
            { key: "User-Agent", value: userAgent },
            { key: "", value: "" },
        ]);
    };
    useEffect(() => {
        addDefaultHeaders();
    }, []);

    const sanitizeHeaders = () => {
        const headers = {};
        clientHeaders
            .filter((k, v) => k && v)
            .reduce((prev, cur) => (prev[cur.key] = cur.value), {} as any);
        return headers;
    };

    const parseSessionOptions = () => ({
        ...sessionOptions,
        timeoutIntervalForRequest: Number(
            sessionOptions.timeoutIntervalForRequest
        ),
        timeoutIntervalForResource: Number(
            sessionOptions.timeoutIntervalForResource
        ),
        httpMaximumConnectionsPerHost: Number(
            sessionOptions.httpMaximumConnectionsPerHost
        ),
    });

    const createClient = async () => {
        const headers = sanitizeHeaders();
        const sessionOptions = parseSessionOptions();
        const options = {
            headers,
            ...sessionOptions,
        };
        const { client, created } = await getOrCreateAPIClient(
            baseUrl,
            options
        );
        if (!created) {
            Alert.alert(
                "Error",
                `A client for ${baseUrl} already exists`,
                [{ text: "OK" }],
                { cancelable: false }
            );
            return;
        }
        const createdClient = {
            name,
            client,
            type: "network",
        };

        navigation.navigate("ClientList", { client: createdClient });
    };

    const addClientHeader = () => {
        setClientHeaders([...clientHeaders, { key: "", value: "" }]);
        scrollView!.current!.scrollToEnd();
    };

    const updateClientHeader = (
        index: number,
        header: { key: string; value: string }
    ) => {
        const newClientHeaders = clientHeaders;
        newClientHeaders[index] = header;
        setClientHeaders(newClientHeaders);
    };

    const renderClientHeaders = () => (
        <ScrollView
            ref={scrollView}
            contentContainerStyle={styles.scrollViewContainer}
        >
            {clientHeaders.map((header, index) => (
                <View key={`header-${index}`} style={styles.header}>
                    <ClientHeader
                        index={index}
                        header={header}
                        updateHeader={updateClientHeader}
                    />
                </View>
            ))}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Mattermost Community Server"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Root URL</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            value={baseUrl}
                            onChangeText={setbaseUrl}
                            placeholder="https://community.mattermost.com"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Follow Redirects?</Text>
                    <CheckBox
                        value={sessionOptions.followRedirects as boolean}
                        onValueChange={setFollowRedirects}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Allow Cellular Access?</Text>
                    <CheckBox
                        value={sessionOptions.allowsCellularAccess as boolean}
                        onValueChange={setAllowsCellularAccess}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Waits For Connectivity?</Text>
                    <CheckBox
                        value={sessionOptions.waitsForConnectivity as boolean}
                        onValueChange={setWaitsForConnectivity}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Timeout Interval For Request
                    </Text>
                    <View style={styles.numericInputContainer}>
                        <TextInput
                            value={`${sessionOptions.timeoutIntervalForRequest}`}
                            onChangeText={setTimeoutIntervalForRequest}
                            placeholder="60"
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Timeout Interval For Resource
                    </Text>
                    <View style={styles.numericInputContainer}>
                        <TextInput
                            value={`${sessionOptions.timeoutIntervalForResource}`}
                            onChangeText={setTimeoutIntervalForResource}
                            placeholder="60"
                            style={styles.input}
                            keyboardType={"numeric"}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Max Connections</Text>
                    <View style={styles.numericInputContainer}>
                        <TextInput
                            value={
                                sessionOptions.httpMaximumConnectionsPerHost as string
                            }
                            onChangeText={setHttpMaximumConnectionsPerHost}
                            placeholder="10"
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.headersLabelContainer}>
                    <Text style={styles.label}>Client Headers</Text>
                    <Button title="+" onPress={addClientHeader} />
                </View>
                <View style={styles.headersContainer}>
                    {renderClientHeaders()}
                </View>
            </ScrollView>

            <Button
                title="Create"
                disabled={name.length === 0 || baseUrl.length === 0}
                onPress={createClient}
            />
        </SafeAreaView>
    );
}
