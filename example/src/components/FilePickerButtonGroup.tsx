import React from "react";
import DocumentPicker from "react-native-document-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { launchImageLibrary } from "react-native-image-picker/src";
import { ButtonGroup } from "react-native-elements";
import { createNativeFile, sampleImage, sampleText } from "../utils";
import { Platform } from "react-native";

type FilePickerButtonGroupProps = {
    disabled: boolean;
    onFilePicked: (file: File) => void;
};

const FilePickerButtonGroup = (props: FilePickerButtonGroupProps) => {
    const hasPhotoLibraryPermissions = async () => {
        if (Platform.OS === "android") return true;

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
                const result = await DocumentPicker.pickSingle({
                    type: [DocumentPicker.types.allFiles],
                    copyTo: "cachesDirectory",
                });

                const file = { ...result, uri: result.fileCopyUri };
                props.onFilePicked(file);
            } catch (err) {
                if (DocumentPicker.isCancel(err as Error)) {
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
                if (result.assets) {
                    const file = {
                        name: result.assets[0].fileName,
                        type: result.assets[0].type,
                        size: result.assets[0].fileSize,
                        uri: result.assets[0].uri,
                    };
                    props.onFilePicked(file);
                }
            });
        }
    };

    const attachFile = async (fileContent: FileContent) => {
        const file: File = await createNativeFile(fileContent);
        props.onFilePicked(file);
    };
    const attachSampleImage = async () => {
        await attachFile(sampleImage);
    };
    const attachSampleText = async () => {
        await attachFile(sampleText);
    };

    const buttons = [
        { title: "Select Image", onPress: pickImage, android: true },
        { title: "Select File", onPress: pickFile, android: true },
        { title: "Attach Image", onPress: attachSampleImage, android: false },
        { title: "Attach Text", onPress: attachSampleText, android: false },
    ];

    const onButtonPress = (index: number) => buttons[index].onPress();

    return (
        <ButtonGroup
            buttons={buttons
                .filter((b) => (Platform.OS === "android" ? b.android : true))
                .map((button) => button.title)}
            onPress={onButtonPress}
            disabled={props.disabled}
        />
    );
};

export default FilePickerButtonGroup;
