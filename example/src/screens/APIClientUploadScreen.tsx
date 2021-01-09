import React, { useState } from "react";
import { Image, View } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { launchImageLibrary } from "react-native-image-picker/src";
import { Bar as ProgressBar } from "react-native-progress";
import { Button, ButtonGroup } from "react-native-elements";

import type { ImagePickerResponse } from "react-native-image-picker/src";

const APIClientUploadScreen = ({ route }: APIClientUploadScreenProps) => {
    const {
        item: { client },
    } = route.params;

    const [file, setFile] = useState<ImagePickerResponse>();
    const [progress, setProgress] = useState(0);

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

    const upload = () =>
        client.upload("/", file!.uri!).progress!((fractionCompleted) => {
            setProgress(fractionCompleted);
        });

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

    return (
        <View>
            <ButtonGroup
                buttons={buttons.map((button) => button.title)}
                onPress={onButtonPress}
            />
            <ImageToUpload />
            <Button title="Upload" onPress={upload} />
        </View>
    );
};

export default APIClientUploadScreen;
