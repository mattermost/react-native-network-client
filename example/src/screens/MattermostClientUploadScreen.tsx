import { useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { Button, Input } from "react-native-elements";

import FilePickerButtonGroup from "../components/FilePickerButtonGroup";
import ProgressiveFileUpload from "../components/ProgressiveFileUpload";
import { UploadStatus } from "../utils";

import type {
    ClientResponse,
    ClientResponseError,
    ProgressPromise,
    RequestOptions,
    UploadRequestOptions,
} from "@mattermost/react-native-network-client";

const DEFAULT_CHANNEL_ID = "4dtzmswn93f68fkd97eeafm6xc";

type UploadState = {
    request?: ProgressPromise<ClientResponse>;
    channelId?: string;
    sessionId?: string;
    file?: File;
    progress: number;
    status?: UploadStatus;
    uploadedFileId?: number;
};

type UploadButtonProps = {
    channelId?: string;
    sessionId?: string;
    fileUri?: string | null;
    status?: UploadStatus;
    createUploadSession: () => void;
    upload: () => void;
    cancelUpload: () => void;
    resumeUpload: () => void;
    resetState: () => void;
    post: () => void;
};

const UploadButton = (props: UploadButtonProps) => {
    const hasChannelId = Boolean(props.channelId);
    const hasSessionId = Boolean(props.sessionId);
    const hasFileUri = Boolean(props.fileUri);

    if (!hasChannelId || !hasFileUri) {
        return null;
    }

    let title;
    let onPress;
    let error;
    let reset;
    if (!hasSessionId) {
        title = "Create Upload Session";
        onPress = () => props.createUploadSession();
    } else if (props.status === undefined) {
        title = "Upload File";
        onPress = () => props.upload();
    } else if (props.status === UploadStatus.UPLOADING) {
        title = "Cancel Upload";
        onPress = () => props.cancelUpload();
    } else if (props.status === UploadStatus.FAILED) {
        title = "Resume";
        onPress = () => props.resumeUpload();
        error = "Upload error";
        reset = true;
    } else if (props.status === UploadStatus.COMPLETED) {
        title = "Post";
        onPress = () => props.post();
    } else if (props.status === UploadStatus.POST_FAILED) {
        title = "Retry post";
        onPress = () => props.post();
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
            <View
                style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                }}
            >
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Button title={title} onPress={onPress} />
                </View>
                {reset && (
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Button title="Reset" onPress={props.resetState} />
                    </View>
                )}
            </View>
        </View>
    );
};

const MattermostClientUploadScreen = () => {
    const route = useRoute<APIClientUploadScreenProps['route']>();
    const {
        item: { client },
    } = route.params;

    const [state, setState] = useState<UploadState>({
        channelId: DEFAULT_CHANNEL_ID,
        progress: 0,
    });

    const setRequest = (request?: ProgressPromise<ClientResponse>) =>
        setState((state) => ({ ...state, request }));
    const setChannelId = (channelId: string) =>
        setState((state) => ({ ...state, channelId }));
    const setSessionId = (sessionId: string) =>
        setState((state) => ({ ...state, sessionId }));
    const setFile = (file: File) => setState((state) => ({ ...state, file }));
    const setProgress = (progress: number) =>
        setState((state) => ({ ...state, progress }));
    const setStatus = (status?: UploadStatus) => {
        setState((state) => ({ ...state, status }));
    };
    const setStatedFileId = (uploadedFileId: number) =>
        setState((state) => ({ ...state, uploadedFileId }));

    const resetState = () =>
        setState({
            request: undefined,
            channelId: DEFAULT_CHANNEL_ID,
            sessionId: "",
            file: undefined,
            progress: 0,
            status: undefined,
        });

    const createUploadSession = async () => {
        const options: RequestOptions = {
            body: {
                channel_id: state.channelId,
                filename: state.file!.name,
                file_size: state.file!.size,
            },
        };

        try {
            const response = await client.post("/api/v4/uploads", options);
            setSessionId(response.data!.id as string);
        } catch (e) {
            const error = e as Error;
            Alert.alert("Session creation error", error.message);
        }
    };

    const upload = async (resume?: boolean) => {
        setStatus(UploadStatus.UPLOADING);
        setRequest(undefined);

        let options: UploadRequestOptions = {};
        if (resume) {
            try {
                const { data } = await client.get(
                    `/api/v4/uploads/${state.sessionId}`
                );
                options.skipBytes = data!.file_offset as number;
            } catch (e) {
                const error = e as Error;
                Alert.alert("Resume error", error.message);
            }
        }

        const request = client.upload(
            `/api/v4/uploads/${state.sessionId}`,
            state.file!.uri!,
            options
        );
        setRequest(request);

        request.progress!((fractionCompleted: number) => {
            setProgress(fractionCompleted);
        })
            .then((response: ClientResponse) => {
                if (response.ok) {
                    setStatedFileId(response.data!.id as number);
                    setStatus(UploadStatus.COMPLETED);
                } else {
                    setStatus(UploadStatus.FAILED);
                }
            })
            .catch((error: ClientResponseError) => {
                Alert.alert("Upload error", error.message);
                setStatus(UploadStatus.FAILED);
            });
    };

    const resumeUpload = () => upload(true);

    const post = async () => {
        try {
            const requestOptions: RequestOptions = {
                body: {
                    channel_id: state.channelId,
                    message: "Upload test",
                    file_ids: [state.uploadedFileId],
                },
            };
            const response = await client.post("/api/v4/posts", requestOptions);
            if (response.code === 201) {
                resetState();
            } else {
                setStatus(UploadStatus.POST_FAILED);
                Alert.alert("Post error", `Status Code: ${response.code}`);
            }
        } catch (e) {
            const error = e as Error;
            setStatus(UploadStatus.POST_FAILED);
            Alert.alert("Post error", error.message);
        }
    };

    const cancelUpload = () => {
        if (state.request) {
            state.request.cancel!();
        }
    };

    const SessionId = () => {
        if (Boolean(state.sessionId)) {
            return (
                <Input
                    autoCompleteType={undefined}
                    label="Session ID"
                    value={state.sessionId}
                    disabled={true}
                />
            );
        }

        return null;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <Input
                    autoCompleteType={undefined}
                    label="Channel ID"
                    placeholder="pspxu7bu17yttmtnzsjnqu78fe"
                    value={state.channelId}
                    onChangeText={setChannelId}
                    autoCapitalize="none"
                />
                <SessionId />
                <FilePickerButtonGroup
                    onFilePicked={setFile}
                    disabled={Boolean(state.status)}
                />
                <ProgressiveFileUpload
                    file={state.file}
                    progress={state.progress}
                />
            </ScrollView>
            <UploadButton
                channelId={state.channelId}
                sessionId={state.sessionId}
                fileUri={state.file?.uri}
                status={state.status}
                createUploadSession={createUploadSession}
                upload={upload}
                cancelUpload={cancelUpload}
                resumeUpload={resumeUpload}
                resetState={resetState}
                post={post}
            />
        </SafeAreaView>
    );
};

export default MattermostClientUploadScreen;
