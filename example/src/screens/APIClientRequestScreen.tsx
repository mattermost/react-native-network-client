// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView } from "react-native";
import { Button, Input } from "react-native-elements";

import AddHeaders from "../components/AddHeaders";
import NumericInput from "../components/NumericInput";
import ResponseSuccessOverlay from "../components/ResponseSuccessOverlay";
import ResponseErrorOverlay from "../components/ResponseErrorOverlay";
import RetryPolicyConfiguration from "../components/RetryPolicyConfiguration";
import { useRetryPolicyConfiguration } from "../hooks";
import { parseHeaders, METHODS } from "../utils";

import type {
    ClientResponse,
    ClientResponseError,
    RequestOptions,
} from "@mattermost/react-native-network-client";

const APIClientRequestScreen = ({ route }: APIClientRequestScreenProps) => {
    const {
        item: { client },
        method,
    } = route.params;
    const [endpoint, setEndpoint] = useState(
        method === METHODS.POST ? "/api/v4/users/login" : "/api/v4/users/me"
    );
    const [timeoutInterval, setTimeoutInterval] = useState(30000);
    const [body, setBody] = useState<string|undefined>();
    const [requestHeaders, setRequestHeaders] = useState<Header[]>([]);
    const [response, setResponse] = useState<ClientResponse>();
    const [responseSuccessVisible, setResponseSuccessVisible] = useState(false);
    const [error, setError] = useState<ClientResponseError>();
    const [responseErrorVisible, setResponseErrorVisible] = useState(false);
    const [
        retryPolicyConfiguration,
        setRetryPolicyType,
        setRetryLimit,
        setRetryInterval,
        setExponentialBackoffBase,
        setExponentialBackoffScale,
        setStatusCodes,
    ] = useRetryPolicyConfiguration();

    const makeRequest = async () => {
        const headers = parseHeaders(requestHeaders);
        let options: RequestOptions = {
            headers,
            timeoutInterval,
            retryPolicyConfiguration,
        };

        const canIncludeBody = ![METHODS.HEAD, METHODS.GET].includes(
            method as METHODS
        );
        if (canIncludeBody && body?.length) {
            try {
                options.body = JSON.parse(body);
            } catch (e) {
                const error = e as Error;
                Alert.alert("Error parsing Body", error.message, [{ text: "OK" }], {
                    cancelable: false,
                });
                return;
            }
        }

        try {
            let clientMethod;
            switch (method) {
                case METHODS.HEAD:
                    clientMethod = client.head;
                    break;
                case METHODS.GET:
                    clientMethod = client.get;
                    break;
                case METHODS.POST:
                    clientMethod = client.post;
                    break;
                case METHODS.PUT:
                    clientMethod = client.put;
                    break;
                case METHODS.PATCH:
                    clientMethod = client.patch;
                    break;
                case METHODS.DELETE:
                    clientMethod = client.delete;
                    break;
                default:
                    throw new Error("Invalid request method");
            }
            var response = await clientMethod(endpoint, options);
            setResponse(response);
            setError(undefined);
            setResponseSuccessVisible(true);
            setResponseErrorVisible(false);
        } catch (error) {
            setResponse(undefined);
            setError(error as ClientResponseError);
            setResponseSuccessVisible(false);
            setResponseErrorVisible(true);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 5,
                    margin: 10,
                }}
                testID="api_client_request.scroll_view"
                persistentScrollbar={true}
                showsVerticalScrollIndicator={true}
            >
                <Input
                    label={`${method}\n\n${client.baseUrl}`}
                    placeholder="/api/v4/system/ping"
                    value={endpoint}
                    onChangeText={setEndpoint}
                    autoCapitalize="none"
                    testID="api_client_request.path.input"
                />
                <AddHeaders onHeadersChanged={setRequestHeaders} />
                {method !== METHODS.GET && (
                    <Input
                        label="Body"
                        placeholder='{"username": "johndoe"}'
                        value={body}
                        onChangeText={setBody}
                        autoCapitalize="none"
                        testID="api_client_request.body.input"
                    />
                )}
                <NumericInput
                    title="Timeout Interval (ms)"
                    value={timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
                    step={5000}
                    testID="api_client_request.timeout_interval.input"
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
                />
                <ResponseSuccessOverlay
                    response={response}
                    visible={responseSuccessVisible}
                    setVisible={setResponseSuccessVisible}
                />
                <ResponseErrorOverlay
                    error={error}
                    visible={responseErrorVisible}
                    setVisible={setResponseErrorVisible}
                />
            </ScrollView>
            <Button
                title="Request"
                onPress={makeRequest}
                disabled={!endpoint.length}
                containerStyle={{ padding: 5 }}
            />
        </SafeAreaView>
    );
};

export default APIClientRequestScreen;
