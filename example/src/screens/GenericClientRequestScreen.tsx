import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView } from "react-native";
import { Button, ButtonGroup, Input } from "react-native-elements";

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

const GenericClientRequestScreen = ({
    route,
}: GenericClientRequestScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [url, setUrl] = useState("");
    const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
    const [timeoutInterval, setTimeoutInterval] = useState(30000);
    const [body, setBody] = useState('{"login_id":"","password":""}');
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
        setRetryMethods,
    ] = useRetryPolicyConfiguration();

    const methods = Object.keys(METHODS);

    const makeRequest = async () => {
        const method = methods[selectedMethodIndex];
        const headers = parseHeaders(requestHeaders);
        let options: RequestOptions = {
            headers,
            timeoutInterval,
            retryPolicyConfiguration,
        };

        const canIncludeBody = ![METHODS.HEAD, METHODS.GET].includes(
            method as METHODS
        );
        if (canIncludeBody && body.length) {
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
                case METHODS.PUT:
                    clientMethod = client.put;
                    break;
                case METHODS.POST:
                    clientMethod = client.post;
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
            var response = await clientMethod(url, options);
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
                testID="generic_client_request.scroll_view"
            >
                <ButtonGroup
                    onPress={setSelectedMethodIndex}
                    selectedIndex={selectedMethodIndex}
                    buttons={methods}
                    containerStyle={{ height: 50 }}
                />
                <Input
                    autoCompleteType={undefined}
                    label="URL"
                    placeholder="https://google.com"
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    testID="generic_client_request.url.input"
                />
                <AddHeaders onHeadersChanged={setRequestHeaders} />
                {methods[selectedMethodIndex] !== METHODS.GET && (
                    <Input
                        autoCompleteType={undefined}
                        label="Body"
                        placeholder='{"username": "johndoe"}'
                        value={body}
                        onChangeText={setBody}
                        autoCapitalize="none"
                        testID="generic_client_request.body.input"
                    />
                )}
                <NumericInput
                    title="Timeout Interval (ms)"
                    value={timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
                    step={5000}
                    testID="generic_client_request.timeout_interval.input"
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
                disabled={!url.length}
                containerStyle={{ padding: 5 }}
            />
        </SafeAreaView>
    );
};

export default GenericClientRequestScreen;
