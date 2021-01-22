// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Button, CheckBox, Input } from "react-native-elements";

import { getOrCreateAPIClient } from "@mattermost/react-native-network-client";

import AddHeaders from "../components/AddHeaders";
import NumericInput from "../components/NumericInput";
import RetryPolicyConfiguration from "../components/RetryPolicyConfiguration";
import { useRetryPolicyConfiguration, useSessionConfiguration } from "../hooks";
import { parseHeaders } from "../utils";

const styles = StyleSheet.create({
    checkboxText: { flex: 1 },
});

export default function CreateAPIClientScreen({
    navigation,
}: CreateAPIClientScreenProps) {
    const [name, setName] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [clientHeaders, setClientHeaders] = useState<Header[]>([]);

    const [
        sessionConfiguration,
        toggleFollowRedirects,
        toggleAllowsCellularAccess,
        toggleWaitsForConnectivity,
        toggleCancelRequestsOnUnauthorized,
        setTimeoutIntervalForRequest,
        setTimeoutIntervalForResource,
        setHttpMaximumConnectionsPerHost,
    ] = useSessionConfiguration();

    const [
        retryPolicyConfiguration,
        toggleRetryPolicyType,
        setRetryLimit,
        setExponentialBackoffBase,
        setExponentialBackoffScale,
    ] = useRetryPolicyConfiguration();

    const [
        requestAdapterConfiguration,
        setRequestAdapterConfiguration,
    ] = useState<RequestAdapterConfiguration>({
        bearerAuthTokenResponseHeader: "",
    });

    const setBearerAuthTokenResponseHeader = (
        bearerAuthTokenResponseHeader: string
    ) =>
        setRequestAdapterConfiguration({
            ...requestAdapterConfiguration,
            bearerAuthTokenResponseHeader,
        });

    const createClient = async () => {
        const headers = parseHeaders(clientHeaders);
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
        const createdClient: APIClientItem = {
            name,
            client,
        };

        navigation.navigate("ClientList", { createdClient });
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <Input
                    label="Name"
                    onChangeText={setName}
                    testID='create_api_client.name.input'
                />
                <Input
                    label="Base URL"
                    onChangeText={setBaseUrl}
                    autoCapitalize="none"
                    testID='create_api_client.base_url.input'
                />

                <AddHeaders onHeadersChanged={setClientHeaders} />

                <Input
                    label="Bearer Auth Token Response Header"
                    onChangeText={setBearerAuthTokenResponseHeader}
                    placeholder="token"
                    autoCapitalize="none"
                    testID='create_api_client.bearer_auth_token.input'
                />

                <NumericInput
                    title="Request Timeout Interval"
                    value={sessionConfiguration.timeoutIntervalForRequest}
                    onChange={setTimeoutIntervalForRequest}
                    minValue={0}
                    testID='create_api_client.request_timeout_interval.input'
                />

                <NumericInput
                    title="Resource Timeout Interval"
                    value={sessionConfiguration.timeoutIntervalForResource}
                    onChange={setTimeoutIntervalForResource}
                    minValue={0}
                    testID='create_api_client.resource_timeout_interval.input'
                />

                <NumericInput
                    title="Max Connections"
                    value={sessionConfiguration.httpMaximumConnectionsPerHost}
                    onChange={setHttpMaximumConnectionsPerHost}
                    minValue={1}
                    testID='create_api_client.max_connects.input'
                />

                <RetryPolicyConfiguration
                    checked={Boolean(retryPolicyConfiguration.type)}
                    onCheckBoxPress={toggleRetryPolicyType}
                    retryLimit={retryPolicyConfiguration.retryLimit}
                    setRetryLimit={setRetryLimit}
                    exponentialBackoffBase={
                        retryPolicyConfiguration.exponentialBackoffBase
                    }
                    setExponentialBackoffBase={setExponentialBackoffBase}
                    exponentialBackoffScale={
                        retryPolicyConfiguration.exponentialBackoffScale
                    }
                    setExponentialBackoffScale={setExponentialBackoffScale}
                />

                <CheckBox
                    title="Follow Redirects?"
                    checked={sessionConfiguration.followRedirects as boolean}
                    onPress={toggleFollowRedirects}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <CheckBox
                    title="Allow Cellular Access?"
                    checked={
                        sessionConfiguration.allowsCellularAccess as boolean
                    }
                    onPress={toggleAllowsCellularAccess}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <CheckBox
                    title="Waits For Connectivity?"
                    checked={
                        sessionConfiguration.waitsForConnectivity as boolean
                    }
                    onPress={toggleWaitsForConnectivity}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <CheckBox
                    title="Cancel Requests On 401?"
                    checked={
                        sessionConfiguration.cancelRequestsOnUnauthorized as boolean
                    }
                    onPress={toggleCancelRequestsOnUnauthorized}
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={styles.checkboxText}
                />

                <Button title="Create" onPress={createClient} />
            </ScrollView>
        </SafeAreaView>
    );
}
