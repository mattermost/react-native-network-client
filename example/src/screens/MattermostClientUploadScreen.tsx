import React, { useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, View } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { launchImageLibrary } from "react-native-image-picker/src";
import { Bar as ProgressBar } from "react-native-progress";
import { Button, ButtonGroup, Input, Text } from "react-native-elements";
import Icon from "react-native-vector-icons/Ionicons";

type UploadFailure = {
    offset?: number;
    size?: number;
};

type ParsedPickerResponse = {
    name?: string;
    size?: number;
    type?: string;
    uri?: string;
};

const MattermostClientUploadScreen = ({
    route,
}: APIClientUploadScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [channelId, setChannelId] = useState("pspxu7bu17yttmtnzsjnqu78fe");
    const [sessionId, setSessionId] = useState("");
    const [file, setFile] = useState<ParsedPickerResponse>();
    const [progress, setProgress] = useState(0);
    const [uploadFailure, setUploadFailure] = useState<UploadFailure>({});

    const reset = () => {
        setSessionId("");
        setFile({});
        setProgress(0);
        setUploadFailure({});
    };

    const createUploadSession = async () => {
        const options: RequestOptions = {
            body: {
                channel_id: channelId,
                filename: file!.name,
                file_size: file!.size,
            },
        };
        const response = await client.post("/api/v4/uploads", options);
        if (response?.code === 201) {
            setSessionId(response.data!.id as string);
        } else {
            console.log(response);
        }
    };

    const uploadAndPost = async (skipBytes?: number) => {
        setUploadFailure({});

        let options: UploadRequestOptions = {};
        if (skipBytes !== undefined) {
            options.skipBytes = skipBytes;
        }

        let uploadResponse;
        try {
            uploadResponse = await client.upload(
                `/api/v4/uploads/${sessionId}`,
                file!.uri!,
                options
            ).progress!((fractionCompleted) => {
                setProgress(fractionCompleted);
            });
        } catch (error) {
            Alert.alert("Upload error", error.message);
        }

        if (uploadResponse?.code === 200) {
            try {
                const requestOptions: RequestOptions = {
                    body: {
                        channel_id: channelId,
                        message: options.skipBytes
                            ? "Resume upload test"
                            : "Upload test",
                        file_ids: [uploadResponse.data!.id],
                    },
                };
                await client.post("/api/v4/posts", requestOptions);
                reset();
            } catch (error) {
                Alert.alert("Post error", error.message);
            }
        } else {
            const { data } = await client.get(`/api/v4/uploads/${sessionId}`);
            setUploadFailure({
                offset: data!.file_offset as number,
                size: data!.file_size as number,
            });
        }
    };

    const resumeUploadAndPost = () => uploadAndPost(uploadFailure.offset);

    const hasPhotoLibraryPermissions = async () => {
        let result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
            return true;
        } else if (
            result !== RESULTS.BLOCKED &&
            result !== RESULTS.UNAVAILABLE
        ) {
            await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
            hasPhotoLibraryPermissions();
        }

        return false;
    };

    const pickFile = async () => {
        const hasPermission = await hasPhotoLibraryPermissions();
        if (hasPermission) {
            try {
                const result = await DocumentPicker.pick({
                    type: [DocumentPicker.types.allFiles],
                });
                setFile(result);
            } catch (err) {
                if (DocumentPicker.isCancel(err)) {
                    // User cancelled the picker, exit any dialogs or menus and move on
                } else {
                    throw err;
                }
            }
        }
    };

    const pickImage = async () => {
        const hasPermission = await hasPhotoLibraryPermissions();
        if (hasPermission) {
            launchImageLibrary({ quality: 1, mediaType: "photo" }, (result) => {
                setFile({
                    name: result.fileName,
                    type: result.type,
                    size: result.fileSize,
                    uri: result.uri,
                });
            });
        }
    };

    const buttons = [
        { title: "Select Image", onPress: pickImage },
        { title: "Select File", onPress: pickFile },
    ];

    const onButtonPress = (index: number) => buttons[index].onPress();

    const FileToUpload = () => {
        if (Boolean(file?.uri)) {
            const FileComponent = () =>
                file?.type && file.type.startsWith("image") ? (
                    <Image
                        source={{ uri: file!.uri }}
                        style={{
                            marginTop: 20,
                            width: 200,
                            height: 200,
                            alignSelf: "center",
                        }}
                    />
                ) : (
                    <View
                        style={{
                            borderWidth: 1,
                            width: 200,
                            height: 200,
                            alignSelf: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Icon
                            name="document-text"
                            size={64}
                            style={{ alignSelf: "center" }}
                        />
                    </View>
                );

            return (
                <>
                    <FileComponent />
                    <Text style={{ alignSelf: "center" }}>{file?.name}</Text>
                    <ProgressBar
                        progress={progress}
                        width={200}
                        style={{ alignSelf: "center" }}
                    />
                </>
            );
        }

        return null;
    };

    const SessionId = () => {
        if (Boolean(sessionId)) {
            return (
                <Input label="Session ID" value={sessionId} disabled={true} />
            );
        }

        return null;
    };

    const UploadButton = () => {
        const hasChannelId = Boolean(channelId);
        const hasSessionId = Boolean(sessionId);
        const hasFileUri = Boolean(file?.uri);
        const failed = Boolean(uploadFailure.size);

        if (hasChannelId && !hasSessionId && hasFileUri) {
            return (
                <Button
                    title="Create Upload Session"
                    onPress={createUploadSession}
                    style={{ paddingHorizontal: 10, paddingVertical: 5 }}
                />
            );
        } else if (hasChannelId && hasSessionId && hasFileUri && !failed) {
            return (
                <Button
                    title="Upload and Post"
                    onPress={() => uploadAndPost()}
                    style={{ paddingHorizontal: 10, paddingVertical: 5 }}
                />
            );
        } else if (failed) {
            return (
                <View>
                    <Text
                        style={{
                            color: "red",
                            alignSelf: "center",
                            padding: 10,
                        }}
                    >
                        {`Uploading failed at ${uploadFailure.offset} of ${uploadFailure.size}`}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-evenly",
                        }}
                    >
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                            <Button
                                title="Resume?"
                                onPress={resumeUploadAndPost}
                            />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                            <Button title="Cancel" />
                        </View>
                    </View>
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <Input
                    label="Channel ID"
                    placeholder="pspxu7bu17yttmtnzsjnqu78fe"
                    value={channelId}
                    onChangeText={setChannelId}
                    autoCapitalize="none"
                />
                <SessionId />
                <ButtonGroup
                    buttons={buttons.map((button) => button.title)}
                    onPress={onButtonPress}
                />
                <FileToUpload />
            </ScrollView>
            <UploadButton />
        </SafeAreaView>
    );
};

export default MattermostClientUploadScreen;
