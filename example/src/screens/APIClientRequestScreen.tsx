// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView } from "react-native";
import { Button, Input } from "react-native-elements";

import { Constants } from "@mattermost/react-native-network-client";

import AddHeaders from "../components/AddHeaders";
import NumericInput from "../components/NumericInput";
import ResponseOverlay from "../components/ResponseOverlay";
import RetryPolicyConfiguration from "../components/RetryPolicyConfiguration";
import { parseHeaders, METHODS } from "../utils";

const APIClientRequestScreen = ({ route }: APIClientRequestScreenProps) => {
    const {
        item: { client },
        method,
    } = route.params;
    const [endpoint, setEndpoint] = useState(
        method === METHODS.POST ? "/api/v4/users/login" : "/api/v4/users/me"
    );
    const [timeoutInterval, setTimeoutInterval] = useState(30);
    const [body, setBody] = useState(
        '{"login_id":"username","password":"password"}'
    );
    const [requestHeaders, setRequestHeaders] = useState<Header[]>([]);
    const [response, setResponse] = useState<ClientResponse>();
    const [responseVisible, setResponseVisible] = useState(false);
    const [retryPolicyConfiguration, setRetryPolicyConfiguration] = useState<
        RetryPolicyConfiguration
    >({
        type: undefined,
        retryLimit: 2,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 0.5,
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

    const makeRequest = async () => {
        const headers = parseHeaders(requestHeaders);
        let options: RequestOptions = {
            headers,
            timeoutInterval,
            retryPolicyConfiguration,
        };
        if (method !== METHODS.GET && body.length) {
            try {
                options.body = JSON.parse(body);
            } catch (e) {
                Alert.alert("Error parsing Body", e.message, [{ text: "OK" }], {
                    cancelable: false,
                });
                return;
            }
        }

        try {
            let clientMethod;
            switch (method) {
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
            setResponseVisible(true);
        } catch (e) {
            Alert.alert("Error", e.message, [{ text: "OK" }], {
                cancelable: false,
            });
        }
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <Input
                    label={`${method}\n\n${client.baseUrl}`}
                    placeholder="/api/v4/system/ping"
                    value={endpoint}
                    onChangeText={setEndpoint}
                    autoCapitalize="none"
                />
                <AddHeaders onHeadersChanged={setRequestHeaders} />
                {method !== METHODS.GET && (
                    <Input
                        label="Body"
                        placeholder='{"username": "johndoe"}'
                        value={body}
                        onChangeText={setBody}
                        autoCapitalize="none"
                    />
                )}
                <NumericInput
                    title="Timeout Interval"
                    value={timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
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
                <ResponseOverlay
                    response={response}
                    visible={responseVisible}
                    setVisible={setResponseVisible}
                />
                <Button
                    title="Request"
                    onPress={makeRequest}
                    disabled={!endpoint.length}
                    style={{ paddingHorizontal: 10 }}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default APIClientRequestScreen;
