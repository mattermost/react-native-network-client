import React, { useState } from "react";
import { Image, SafeAreaView, ScrollView } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { launchImageLibrary } from "react-native-image-picker/src/index";
import { Bar as ProgressBar } from "react-native-progress";
import { Button, ButtonGroup, Input } from "react-native-elements";

import type { ImagePickerResponse } from "react-native-image-picker/src/index";

const MattermostClientUploadScreen = ({
    route,
}: APIClientUploadScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [channelId, setChannelId] = useState("ygpq783yqig5ic9kimojf3nrro");
    const [sessionId, setSessionId] = useState("");
    const [file, setFile] = useState<ImagePickerResponse>();
    const [progress, setProgress] = useState(0);

    const createUploadSession = async () => {
        const options: RequestOptions = {
            body: {
                channel_id: channelId,
                filename: file!.fileName,
                file_size: file!.fileSize,
            },
        };
        const response = await client.post("/api/v4/uploads", options);
        if (response?.code === 201) {
            setSessionId(response.data!.id as string);
        } else {
            console.log(response);
        }
    };

    const uploadAndPost = async () => {
        const uploadResponse = await client.upload(
            `/api/v4/uploads/${sessionId}`,
            file!.uri!
        ).progress!((fractionCompleted) => {
            setProgress(fractionCompleted);
        });

        if (uploadResponse?.code === 200) {
            const options: RequestOptions = {
                body: {
                    channel_id: channelId,
                    message: "Upload test",
                    file_ids: [uploadResponse.data!.id],
                },
            };
            await client.post("/api/v4/posts", options);
        } else {
            console.log(uploadResponse);
        }
    };

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
                console.log(result);
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
                setFile(result);
            });
        }
    };

    const buttons = [
        { title: "Select Image", onPress: pickImage },
        { title: "Select File", onPress: pickFile },
    ];

    const onButtonPress = (index: number) => buttons[index].onPress();

    const ImageToUpload = () => {
        if (Boolean(file?.uri)) {
            return (
                <>
                    <Image
                        source={{ uri: file!.uri }}
                        style={{
                            marginTop: 20,
                            width: 200,
                            height: 200,
                            alignSelf: "center",
                        }}
                    />
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

    const CreateSessionButton = () => {
        if (Boolean(channelId) && !Boolean(sessionId) && Boolean(file?.uri)) {
            return (
                <Button
                    title="Create Upload Session"
                    onPress={createUploadSession}
                    style={{ paddingHorizontal: 10, paddingVertical: 5 }}
                />
            );
        }

        return null;
    };

    const UploadButton = () => {
        if (Boolean(channelId) && Boolean(sessionId) && Boolean(file?.uri)) {
            return (
                <Button
                    title="Upload and Post"
                    onPress={uploadAndPost}
                    style={{ paddingHorizontal: 10, paddingVertical: 5 }}
                />
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
                <ImageToUpload />
            </ScrollView>
            <CreateSessionButton />
            <UploadButton />
        </SafeAreaView>
    );
};

export default MattermostClientUploadScreen;
