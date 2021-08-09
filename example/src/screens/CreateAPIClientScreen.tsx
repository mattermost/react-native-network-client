// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Button, CheckBox, Input } from "react-native-elements";

import { getOrCreateAPIClient } from "@mattermost/react-native-network-client";

import AddHeaders from "../components/AddHeaders";
import P12Inputs from "../components/P12Inputs";
import NumericInput from "../components/NumericInput";
import RetryPolicyConfiguration from "../components/RetryPolicyConfiguration";
import {
    useRetryPolicyConfiguration,
    useSessionConfiguration,
    useClientP12Configuration,
} from "../hooks";
import { ClientType, parseHeaders, apiClientErrorEventHandler } from "../utils";

import type {
    APIClientConfiguration,
    RequestAdapterConfiguration,
} from "@mattermost/react-native-network-client";

const styles = StyleSheet.create({
    checkboxText: { flex: 1 },
    createButton: { padding: 10 },
});

export default function CreateAPIClientScreen({
    navigation,
}: CreateAPIClientScreenProps) {
    const [name, setName] = useState("MM");
    const [baseUrl, setBaseUrl] = useState("https://community.mattermost.com");
    const [clientHeaders, setClientHeaders] = useState<Header[]>([]);
    const [alertOnClientError, setAlertOnClientError] = useState(true);
    const toggleAlertOnClientError = () =>
        setAlertOnClientError((alertOnClientError) => !alertOnClientError);

    const [
        sessionConfiguration,
        toggleAllowsCellularAccess,
        toggleWaitsForConnectivity,
        toggleCancelRequestsOnUnauthorized,
        toggleTrustSelfSignedServerCertificate,
        setTimeoutIntervalForRequest,
        setTimeoutIntervalForResource,
        setHttpMaximumConnectionsPerHost,
    ] = useSessionConfiguration();

    const [
        retryPolicyConfiguration,
        setRetryPolicyType,
        setRetryLimit,
        setRetryInterval,
        setExponentialBackoffBase,
        setExponentialBackoffScale,
        setStatusCodes,
        setRetryMethods,
    ] = useRetryPolicyConfiguration();

    const [
        clientP12Configuration,
        setClientP12Path,
        setClientP12Password,
    ] = useClientP12Configuration();

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

        if (clientP12Configuration.path && clientP12Configuration.path !== "") {
            options["clientP12Configuration"] = clientP12Configuration;
        }

        const clientErrorEventHandler = alertOnClientError
            ? apiClientErrorEventHandler
            : undefined;

        const { client, created } = await getOrCreateAPIClient(
            baseUrl,
            options,
            clientErrorEventHandler
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
            type: ClientType.API,
        };

        navigation.navigate("ClientList", { createdClient });
    };

    return (
        <SafeAreaView>
            <ScrollView testID="create_api_client.scroll_view">
                <Input
                    label="Name"
                    onChangeText={setName}
                    autoCorrect={false}
                    testID="create_api_client.name.input"
                />
                <Input
                    label="Base URL"
                    onChangeText={setBaseUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="create_api_client.base_url.input"
                />

                <AddHeaders onHeadersChanged={setClientHeaders} />

                <Input
                    label="Bearer Auth Token Response Header"
                    onChangeText={setBearerAuthTokenResponseHeader}
                    placeholder="token"
                    autoCapitalize="none"
                    value="token"
                    testID="create_api_client.bearer_auth_token.input"
                />

                <P12Inputs
                    title="Client PKCS12"
                    path={clientP12Configuration.path}
                    password={clientP12Configuration.password}
                    onSelectP12={setClientP12Path}
                    onPasswordChange={setClientP12Password}
                />

                <NumericInput
                    title="Request Timeout Interval (ms)"
                    value={sessionConfiguration.timeoutIntervalForRequest}
                    onChange={setTimeoutIntervalForRequest}
                    minValue={0}
                    step={5000}
                    testID="create_api_client.request_timeout_interval.input"
                />

                <NumericInput
                    title="Resource Timeout Interval (ms)"
                    value={sessionConfiguration.timeoutIntervalForResource}
                    onChange={setTimeoutIntervalForResource}
                    minValue={0}
                    step={5000}
                    testID="create_api_client.resource_timeout_interval.input"
                />

                <NumericInput
                    title="Max Connections"
                    value={sessionConfiguration.httpMaximumConnectionsPerHost}
                    onChange={setHttpMaximumConnectionsPerHost}
                    minValue={1}
                    testID="create_api_client.max_connections.input"
                />

                <RetryPolicyConfiguration
                    policyType={retryPolicyConfiguration.type}
                    onTypeSelected={setRetryPolicyType}
                    retryLimit={retryPolicyConfiguration.retryLimit}
                    setRetryLimit={setRetryLimit}
                    retryInterval={retryPolicyConfiguration.retryInterval}
                    setRetryInterval={setRetryInterval}
                    exponentialBackoffBase={
                        retryPolicyConfiguration.exponentialBackoffBase
                    }
                    setExponentialBackoffBase={setExponentialBackoffBase}
                    exponentialBackoffScale={
                        retryPolicyConfiguration.exponentialBackoffScale
                    }
                    setExponentialBackoffScale={setExponentialBackoffScale}
                    statusCodes={retryPolicyConfiguration.statusCodes}
                    setStatusCodes={setStatusCodes}
                    retryMethods={retryPolicyConfiguration.retryMethods}
                    setRetryMethods={setRetryMethods}
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
                    title={`Allow Cellular Access? [${sessionConfiguration.allowsCellularAccess}]`}
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
                    title={`Waits For Connectivity? [${sessionConfiguration.waitsForConnectivity}]`}
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
                    title={`Cancel Requests On 401? [${sessionConfiguration.cancelRequestsOnUnauthorized}]`}
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

                <CheckBox
                    title={`Trust Self-Signed Server Certificate? [${sessionConfiguration.trustSelfSignedServerCertificate}]`}
                    checked={
                        sessionConfiguration.trustSelfSignedServerCertificate as boolean
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
                    disabled={!name || !baseUrl}
                    style={styles.createButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
