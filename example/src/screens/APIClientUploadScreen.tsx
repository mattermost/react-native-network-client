import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { Button, ButtonGroup, CheckBox, Input } from "react-native-elements";

import FilePickerButtonGroup from "../components/FilePickerButtonGroup";
import ProgressiveFileUpload from "../components/ProgressiveFileUpload";
import NumericInput from "../components/NumericInput";
import { UploadStatus } from "../utils";
import AddMultipart from "../components/AddMultipart";

type UploadState = {
    request?: ProgressPromise<ClientResponse>;
    endpoint: string;
    file?: File;
    progress: number;
    status?: UploadStatus;
};

type UploadButtonProps = {
    endpoint: string;
    fileUri?: string;
    status?: UploadStatus;
    upload: () => void;
    cancelUpload: () => void;
    resetState: () => void;
};

const UploadButton = (props: UploadButtonProps) => {
    const hasEndpoint = Boolean(props.endpoint);
    const hasFileUri = Boolean(props.fileUri);

    if (!hasEndpoint || !hasFileUri) {
        return null;
    }

    let title;
    let onPress;
    let error;
    if (props.status === undefined) {
        title = "Upload File";
        onPress = () => props.upload();
    } else if (props.status === UploadStatus.UPLOADING) {
        title = "Cancel Upload";
        onPress = () => props.cancelUpload();
    } else if (props.status === UploadStatus.FAILED) {
        title = "Reset";
        onPress = () => props.resetState();
        error = "Upload error";
    }

    return (
        <View style={{ flex: 1 }}>
            {error && (
                <Text
                    style={{
                        color: "red",
                        alignSelf: "center",
                        padding: 10,
                    }}
                >
                    {error}
                </Text>
            )}
            <View style={{ flex: 1, padding: 10 }}>
                <Button title={title} onPress={onPress} />
            </View>
        </View>
    );
};

const APIClientUploadScreen = ({ route }: APIClientUploadScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [state, setState] = useState<UploadState>({
        endpoint: "/photos",
        progress: 0,
    });

    const methods = ["POST", "PUT", "PATCH"];
    const [methodIndex, setMethodIndex] = useState<number>(0);
    const [multipart, setMultipart] = useState<boolean>(false);
    const [multipartFileKey, setMultipartFileKey] = useState("");
    const [multipartData, setMultipartData] = useState<Record<string, string>>(
        {}
    );
    const [skipBytes, setSkipBytes] = useState<number>(0);

    const setRequest = (request?: ProgressPromise<ClientResponse>) =>
        setState((state) => ({ ...state, request }));
    const setEndpoint = (endpoint: string) => setState({ ...state, endpoint });
    const setFile = (file: File) => setState((state) => ({ ...state, file }));
    const setProgress = (progress: number) =>
        setState((state) => ({ ...state, progress }));
    const setStatus = (status?: UploadStatus) => {
        setState((state) => ({ ...state, status }));
    };

    const resetState = () =>
        setState((state) => ({
            ...state,
            request: undefined,
            file: undefined,
            progress: 0,
            status: undefined,
        }));

    const upload = async () => {
        setStatus(UploadStatus.UPLOADING);
        setRequest(undefined);

        const reqOptions: UploadRequestOptions = {};

        if (multipart) {
            // Multipart should always send the file key
            reqOptions["multipart"] = {
                fileKey: multipartFileKey,
            };

            // If there is additional data, add it
            if (Object.keys(multipartData).length) {
                reqOptions["multipart"]["data"] = multipartData;
            }
        }

        // Add the following if they're not the defaults
        if (skipBytes > 0) reqOptions["skipBytes"] = skipBytes;
        if (methodIndex > 0) reqOptions["method"] = methods[methodIndex];

        const request = client.upload(
            state.endpoint,
            state.file!.uri!,
            reqOptions
        );
        setRequest(request);

        request.progress!((fractionCompleted) => {
            setProgress(fractionCompleted);
        })
            .then((response) => {
                if (response.ok) {
                    resetState();
                } else {
                    setStatus(UploadStatus.FAILED);
                }
            })
            .catch((error) => {
                Alert.alert("Upload error", error.message);
                setStatus(UploadStatus.FAILED);
            });
    };

    const cancelUpload = () => {
        if (state.request) {
            state.request.cancel!();
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView testID="api_client_upload.scroll_view">
                <Input
                    label="Endpoint"
                    placeholder="/upload"
                    value={state.endpoint}
                    onChangeText={setEndpoint}
                    autoCapitalize="none"
                    testID="api_client_upload.endpoint.input"
                />
                <ButtonGroup
                    onPress={setMethodIndex}
                    selectedIndex={methodIndex}
                    buttons={methods}
                    containerStyle={{ flex: 1 }}
                />
                <FilePickerButtonGroup
                    onFilePicked={setFile}
                    disabled={Boolean(state.status)}
                />
                <CheckBox
                    title={`Send as Multi-part? [${multipart}]`}
                    checked={multipart}
                    onPress={() =>
                        multipart ? setMultipart(false) : setMultipart(true)
                    }
                    iconType="ionicon"
                    checkedIcon="ios-checkmark-circle"
                    uncheckedIcon="ios-checkmark-circle"
                    iconRight
                    textStyle={{ flex: 1 }}
                />
                {multipart && (
                    <>
                        <Input
                            label="Multi-part file key"
                            placeholder="file"
                            value={multipartFileKey}
                            onChangeText={setMultipartFileKey}
                            autoCapitalize="none"
                            testID="api_client_upload.multipart_key.input"
                        />
                        <AddMultipart onMultipartsChanged={setMultipartData} />
                    </>
                )}
                {!multipart && (
                    <NumericInput
                        title="Skip Bytes: "
                        value={skipBytes}
                        onChange={setSkipBytes}
                        minValue={0}
                        testID="api_client_request.skip_bytes.input"
                    />
                )}

                <ProgressiveFileUpload
                    file={state.file}
                    progress={state.progress}
                />

                <UploadButton
                    fileUri={state.file?.uri}
                    endpoint={state.endpoint}
                    status={state.status}
                    upload={upload}
                    cancelUpload={cancelUpload}
                    resetState={resetState}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default APIClientUploadScreen;
