import React, { useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { Button, Input } from "react-native-elements";

import FilePickerButtonGroup from "../components/FilePickerButtonGroup";
import ProgressiveFileUpload from "../components/ProgressiveFileUpload";
import ResponseSuccessOverlay from "../components/ResponseSuccessOverlay";
import ResponseErrorOverlay from "../components/ResponseErrorOverlay";
import { UploadStatus } from "../utils";

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
    if (props.status === undefined) {
        title = "Upload File";
        onPress = () => props.upload();
    } else if (props.status === UploadStatus.UPLOADING) {
        title = "Cancel Upload";
        onPress = () => props.cancelUpload();
    } else if (props.status === UploadStatus.FAILED) {
        title = "Reset";
        onPress = () => props.resetState();
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
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
    const setRequest = (request?: ProgressPromise<ClientResponse>) =>
        setState((state) => ({ ...state, request }));
    const setEndpoint = (endpoint: string) => setState({ ...state, endpoint });
    const setFile = (file: File) => setState((state) => ({ ...state, file }));
    const setProgress = (progress: number) =>
        setState((state) => ({ ...state, progress }));
    const setStatus = (status?: UploadStatus) => {
        setState((state) => ({ ...state, status }));
    };
    const [response, setResponse] = useState<ClientResponse>();
    const [responseSuccessVisible, setResponseSuccessVisible] = useState(false);
    const [error, setError] = useState<ClientResponseError>();
    const [responseErrorVisible, setResponseErrorVisible] = useState(false);

    const setStateFromResponse = (response: ClientResponse) => {
        if (response.ok) {
            resetState();
        } else {
            setState((state) => ({
                ...state,
                request: undefined,
                progress: state.progress === 1 ? 0 : state.progress,
                status: undefined,
            }));
        }
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

        const request = client.upload(state.endpoint, state.file!.uri!);
        setRequest(request);

        request.progress!((fractionCompleted) => {
            setProgress(fractionCompleted);
        })
            .then((response) => {
                setStateFromResponse(response);
                setResponse(response);
                setError(undefined);
                setResponseSuccessVisible(true);
                setResponseErrorVisible(false);
            })
            .catch((error) => {
                setStatus(UploadStatus.FAILED);
                setResponse(undefined);
                setError(error);
                setResponseSuccessVisible(false);
                setResponseErrorVisible(true);
            });
    };

    const cancelUpload = () => {
        if (state.request) {
            state.request.cancel!();
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <Input
                    label="Endpoint"
                    placeholder="/upload"
                    value={state.endpoint}
                    onChangeText={setEndpoint}
                    autoCapitalize="none"
                    testID="api_client_upload.endpoint.input"
                />
                <FilePickerButtonGroup
                    onFilePicked={setFile}
                    disabled={Boolean(state.status)}
                />
                <ProgressiveFileUpload
                    file={state.file}
                    progress={state.progress}
                />
            </ScrollView>
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
            <UploadButton
                fileUri={state.file?.uri}
                endpoint={state.endpoint}
                status={state.status}
                upload={upload}
                cancelUpload={cancelUpload}
                resetState={resetState}
            />
        </SafeAreaView>
    );
};

export default APIClientUploadScreen;
