import React, { useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { Button, Input } from "react-native-elements";
import RFNS from "react-native-fs";
import { Bar as ProgressBar } from "react-native-progress";

import ResponseSuccessOverlay from "../components/ResponseSuccessOverlay";
import ResponseErrorOverlay from "../components/ResponseErrorOverlay";
import { DownloadStatus } from "../utils";

import type {
    ClientResponse,
    ClientResponseError,
    ProgressPromise,
    RequestOptions,
} from "@mattermost/react-native-network-client";

type DownloadState = {
    request?: ProgressPromise<ClientResponse>;
    filePath: string;
    endpoint: string;
    progress: number;
    status?: DownloadStatus;
};

type DownloadButtonProps = {
    endpoint: string;
    filePath: string;
    status?: DownloadStatus;
    download: () => void;
    cancelDownload: () => void;
    resetState: () => void;
};

const DownloadButton = (props: DownloadButtonProps) => {
    const hasEndpoint = Boolean(props.endpoint);
    const hasFilePath = Boolean(props.filePath);

    if (!hasEndpoint || !hasFilePath) {
        return null;
    }

    let title;
    let onPress;
    if (props.status === undefined) {
        title = "Download File";
        onPress = () => props.download();
    } else if (props.status === DownloadStatus.DOWNLOADING) {
        title = "Cancel Download";
        onPress = () => props.cancelDownload();
    } else if (props.status === DownloadStatus.FAILED) {
        title = "Reset";
        onPress = () => props.resetState();
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 10 }}>
                <Button title={title} onPress={onPress} />
            </View>
        </View>
    );
};

const APIClientDownloadScreen = ({ route }: APIClientDownloadScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [state, setState] = useState<DownloadState>({
        filePath: "",
        endpoint: "",
        progress: 0,
    });

    const setRequest = (request?: ProgressPromise<ClientResponse>) =>
        setState((state) => ({ ...state, request }));
    const setFilePath = (filePath: string) =>
        setState((state) => ({ ...state, filePath }));
    const setEndpoint = (endpoint: string) => setState({ ...state, endpoint });
    const setProgress = (progress: number) =>
        setState((state) => ({ ...state, progress }));
    const setStatus = (status?: DownloadStatus) => {
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

    const download = async () => {
        setStatus(DownloadStatus.DOWNLOADING);
        setRequest(undefined);

        const reqOptions: RequestOptions = {};

        const request = client.download(
            state.endpoint,
            state.filePath,
            reqOptions
        );
        setRequest(request);

        request.progress!((fractionCompleted: number) => {
            setProgress(fractionCompleted);
        })
            .then((response: ClientResponse) => {
                setStateFromResponse(response);
                setResponse(response);
                setError(undefined);
                setResponseSuccessVisible(true);
                setResponseErrorVisible(false);
            })
            .catch((error: ClientResponseError) => {
                setStatus(DownloadStatus.FAILED);
                setResponse(undefined);
                setError(error);
                setResponseSuccessVisible(false);
                setResponseErrorVisible(true);
            });
    };

    const cancelDownload = () => {
        if (state.request) {
            state.request.cancel!();
        }
    };

    const setDefaultFilePath = () => {
        setFilePath(RFNS.DocumentDirectoryPath);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView testID="api_client_dowload.scroll_view">
                <Input
                    label="Endpoint"
                    placeholder="/download"
                    value={state.endpoint}
                    onChangeText={setEndpoint}
                    autoCapitalize="none"
                    testID="api_client_download.endpoint.input"
                />

                <Input
                    label="File path"
                    placeholder="file://some/file/path"
                    value={state.filePath}
                    onFocus={setDefaultFilePath}
                    onChangeText={setFilePath}
                    autoCapitalize="none"
                    testID="api_client_download.file_path.input"
                />

                <ProgressBar
                    progress={state.progress}
                    width={200}
                    style={{ alignSelf: "center" }}
                    testID="progress_file_download.progress_bar"
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

                <DownloadButton
                    filePath={state.filePath}
                    endpoint={state.endpoint}
                    status={state.status}
                    download={download}
                    cancelDownload={cancelDownload}
                    resetState={resetState}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default APIClientDownloadScreen;
