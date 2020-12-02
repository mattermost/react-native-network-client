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
import NumericInput from "react-native-numeric-input";
import {
    getOrCreateAPIClient,
    Constants,
} from "@mattermost/react-native-network-client";
import type {
    Client,
    CreateAPIClientScreenProps,
} from "example/@types/navigation";

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
    smallTextInputContainer: {
        flex: 2,
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
                borderColor: PlatformColor("?attr/colorControlNormal"),
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
    const [name, setName] = useState("Mattermost");
    const [baseUrl, setbaseUrl] = useState("https://community.mattermost.com");
    const [clientHeaders, setClientHeaders] = useState<
        { key: string; value: string }[]
    >([]);
    const [sessionConfiguration, setSessionConfiguration] = useState<
        SessionConfiguration
    >({
        followRedirects: true,
        allowsCellularAccess: true,
        waitsForConnectivity: false,
        timeoutIntervalForRequest: 30,
        timeoutIntervalForResource: 30,
        httpMaximumConnectionsPerHost: 10,
        cancelRequestsOnUnauthorized: false,
    });
    const [retryPolicyConfiguration, setRetryPolicyConfiguration] = useState<
        RetryPolicyConfiguration
    >({
        type: undefined,
        retryLimit: 2,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 0.5,
    });
    const [
        requestAdapterConfiguration,
        setRequestAdapterConfiguration,
    ] = useState<RequestAdapterConfiguration>({
        bearerAuthTokenResponseHeader: "",
    });
    const scrollView = useRef<ScrollView>(null);

    const setFollowRedirects = (followRedirects: boolean) =>
        setSessionConfiguration({ ...sessionConfiguration, followRedirects });
    const setAllowsCellularAccess = (allowsCellularAccess: boolean) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            allowsCellularAccess,
        });
    const setWaitsForConnectivity = (waitsForConnectivity: boolean) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            waitsForConnectivity,
        });
    const setTimeoutIntervalForRequest = (timeoutIntervalForRequest: number) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            timeoutIntervalForRequest,
        });
    const setTimeoutIntervalForResource = (
        timeoutIntervalForResource: number
    ) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            timeoutIntervalForResource,
        });
    const setHttpMaximumConnectionsPerHost = (
        httpMaximumConnectionsPerHost: number
    ) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            httpMaximumConnectionsPerHost,
        });
    const setCancelRequestsOnUnauthorized = (
        cancelRequestsOnUnauthorized: boolean
    ) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            cancelRequestsOnUnauthorized,
        });
    const toggleRetryPolicyType = (on: boolean) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            type: on ? Constants.EXPONENTIAL_RETRY : undefined,
        });
    const setRetryLimit = (retryLimit: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            retryLimit,
        });
    const setExponentialBackoffBase = (exponentialBackoffBase: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            exponentialBackoffBase,
        });
    const setExponentialBackoffScale = (exponentialBackoffScale: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            exponentialBackoffScale,
        });
    const setBearerAuthTokenResponseHeader = (
        bearerAuthTokenResponseHeader: string
    ) =>
        setRequestAdapterConfiguration({
            ...requestAdapterConfiguration,
            bearerAuthTokenResponseHeader,
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
    // END TEST MM default headers

    const sanitizeHeaders = () => {
        return clientHeaders
            .filter(({ key, value }) => key && value)
            .reduce(
                (prev, cur) => ({ ...prev, [cur.key]: cur.value }),
                {} as any
            );
    };

    const createClient = async () => {
        const headers = sanitizeHeaders();
        const options: APIClientConfiguration = {
            headers,
            sessionConfiguration,
            retryPolicyConfiguration,
            requestAdapterConfiguration,
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
        const createdClient: Client = {
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

    const renderRetryPolicyConfiguration = () => {
        const checked = Boolean(retryPolicyConfiguration.type);
        const checkbox = (
            <View style={styles.inputContainer}>
                <Text style={styles.label}>
                    Retries with exponential backoff?
                </Text>
                <CheckBox
                    value={checked}
                    onValueChange={toggleRetryPolicyType}
                />
            </View>
        );

        let options;
        if (checked) {
            options = (
                <>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Retry Limit</Text>
                        <View style={styles.numericInputContainer}>
                            <NumericInput
                                value={retryPolicyConfiguration.retryLimit}
                                onChange={setRetryLimit}
                                totalHeight={35}
                                minValue={0}
                            />
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Exponential backoff base
                        </Text>
                        <View style={styles.numericInputContainer}>
                            <NumericInput
                                value={
                                    retryPolicyConfiguration.exponentialBackoffBase
                                }
                                onChange={setExponentialBackoffBase}
                                totalHeight={35}
                                minValue={2}
                            />
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Exponential backoff scale
                        </Text>
                        <View style={styles.numericInputContainer}>
                            <NumericInput
                                value={
                                    retryPolicyConfiguration.exponentialBackoffScale
                                }
                                onChange={setExponentialBackoffScale}
                                totalHeight={35}
                                minValue={0}
                                valueType="real"
                                step={0.1}
                            />
                        </View>
                    </View>
                </>
            );
        }

        return (
            <>
                {checkbox}
                {options}
            </>
        );
    };

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
                    <Text style={styles.label}>
                        Bearer Auth Token Response Header
                    </Text>
                    <View style={styles.smallTextInputContainer}>
                        <TextInput
                            value={
                                requestAdapterConfiguration.bearerAuthTokenResponseHeader
                            }
                            onChangeText={setBearerAuthTokenResponseHeader}
                            placeholder="token"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Follow Redirects?</Text>
                    <CheckBox
                        value={sessionConfiguration.followRedirects as boolean}
                        onValueChange={setFollowRedirects}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Allow Cellular Access?</Text>
                    <CheckBox
                        value={
                            sessionConfiguration.allowsCellularAccess as boolean
                        }
                        onValueChange={setAllowsCellularAccess}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Waits For Connectivity?</Text>
                    <CheckBox
                        value={
                            sessionConfiguration.waitsForConnectivity as boolean
                        }
                        onValueChange={setWaitsForConnectivity}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Cancel Requests On Unauthorized?
                    </Text>
                    <CheckBox
                        value={
                            sessionConfiguration.cancelRequestsOnUnauthorized
                        }
                        onValueChange={setCancelRequestsOnUnauthorized}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Timeout Interval For Request
                    </Text>
                    <View style={styles.numericInputContainer}>
                        <NumericInput
                            value={
                                sessionConfiguration.timeoutIntervalForRequest
                            }
                            onChange={setTimeoutIntervalForRequest}
                            totalHeight={35}
                            minValue={0}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Timeout Interval For Resource
                    </Text>
                    <View style={styles.numericInputContainer}>
                        <NumericInput
                            value={
                                sessionConfiguration.timeoutIntervalForResource
                            }
                            onChange={setTimeoutIntervalForResource}
                            totalHeight={35}
                            minValue={0}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Max Connections</Text>
                    <View style={styles.numericInputContainer}>
                        <NumericInput
                            value={
                                sessionConfiguration.httpMaximumConnectionsPerHost
                            }
                            onChange={setHttpMaximumConnectionsPerHost}
                            totalHeight={35}
                            minValue={1}
                        />
                    </View>
                </View>

                {renderRetryPolicyConfiguration()}

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
