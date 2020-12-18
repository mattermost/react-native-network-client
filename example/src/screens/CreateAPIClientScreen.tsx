// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Button, CheckBox, Input } from "react-native-elements";

import {
    getOrCreateAPIClient,
    Constants,
} from "@mattermost/react-native-network-client";

import AddHeaders from "../components/AddHeaders";
import NumericInput from "../components/NumericInput";
import RetryPolicyConfiguration from "../components/RetryPolicyConfiguration";
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

    const toggleFollowRedirects = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            followRedirects: !sessionConfiguration.followRedirects,
        });
    const toggleAllowsCellularAccess = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            allowsCellularAccess: !sessionConfiguration.allowsCellularAccess,
        });
    const toggleWaitsForConnectivity = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            waitsForConnectivity: !sessionConfiguration.waitsForConnectivity,
        });
    const toggleCancelRequestsOnUnauthorized = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            cancelRequestsOnUnauthorized: !sessionConfiguration.cancelRequestsOnUnauthorized,
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
    const toggleRetryPolicyType = () =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            type: retryPolicyConfiguration.type
                ? undefined
                : Constants.EXPONENTIAL_RETRY,
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
                <Input label="Name" onChangeText={setName} />
                <Input
                    label="Base URL"
                    onChangeText={setBaseUrl}
                    autoCapitalize="none"
                />

                <AddHeaders onHeadersChanged={setClientHeaders} />

                <Input
                    label="Bearer Auth Token Response Header"
                    onChangeText={setBearerAuthTokenResponseHeader}
                    placeholder="token"
                    autoCapitalize="none"
                />

                <NumericInput
                    title="Request Timeout Interval"
                    value={sessionConfiguration.timeoutIntervalForRequest}
                    onChange={setTimeoutIntervalForRequest}
                    minValue={0}
                />

                <NumericInput
                    title="Resource Timeout Interval"
                    value={sessionConfiguration.timeoutIntervalForResource}
                    onChange={setTimeoutIntervalForResource}
                    minValue={0}
                />

                <NumericInput
                    title="Max Connections"
                    value={sessionConfiguration.httpMaximumConnectionsPerHost}
                    onChange={setHttpMaximumConnectionsPerHost}
                    minValue={1}
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
