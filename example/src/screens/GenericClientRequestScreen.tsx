import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView } from "react-native";
import { Button, ButtonGroup, Input } from "react-native-elements";

import AddHeaders from "../components/AddHeaders";
import NumericInput from "../components/NumericInput";
import ResponseOverlay from "../components/ResponseOverlay";
import RetryPolicyConfiguration from "../components/RetryPolicyConfiguration";
import { useRetryPolicyConfiguration } from "../hooks";
import { parseHeaders, METHODS } from "../utils";

const GenericClientRequestScreen = ({
    route,
}: GenericClientRequestScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [url, setUrl] = useState("");
    const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
    const [timeoutInterval, setTimeoutInterval] = useState(30);
    const [body, setBody] = useState('{"login_id":"","password":""}');
    const [requestHeaders, setRequestHeaders] = useState<Header[]>([]);
    const [response, setResponse] = useState<ClientResponse>();
    const [responseVisible, setResponseVisible] = useState(false);
    const [
        retryPolicyConfiguration,
        toggleRetryPolicyType,
        setRetryLimit,
        setExponentialBackoffBase,
        setExponentialBackoffScale,
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
                <ButtonGroup
                    onPress={setSelectedMethodIndex}
                    selectedIndex={selectedMethodIndex}
                    buttons={methods}
                    containerStyle={{ height: 50 }}
                />
                <Input
                    label="URL"
                    placeholder="https://google.com"
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    testID='generic_client_request.url.input'
                />
                <AddHeaders onHeadersChanged={setRequestHeaders} />
                {methods[selectedMethodIndex] !== METHODS.GET && (
                    <Input
                        label="Body"
                        placeholder='{"username": "johndoe"}'
                        value={body}
                        onChangeText={setBody}
                        autoCapitalize="none"
                        testID='generic_client_request.body.input'
                    />
                )}
                <NumericInput
                    title="Timeout Interval"
                    value={timeoutInterval}
                    onChange={setTimeoutInterval}
                    minValue={0}
                    testID='generic_client_request.timeout_interval.input'
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
                    disabled={!url.length}
                    style={{ paddingHorizontal: 10 }}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default GenericClientRequestScreen;
