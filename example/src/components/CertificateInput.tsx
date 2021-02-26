// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { View } from "react-native";
import { Button, Input, Text } from "react-native-elements";
import DocumentPicker from "react-native-document-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import Icon from "react-native-vector-icons/MaterialIcons";

type CertificateInputProps = {
    title: string;
    certificatePath?: string;
    onSelect: (certificate?: string) => void;
};

const CertificateInput = (props: CertificateInputProps) => {
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

    const pickCertificate = async () => {
        const hasPermission = await hasPhotoLibraryPermissions();
        if (hasPermission) {
            try {
                const result = await DocumentPicker.pick({
                    type: [DocumentPicker.types.allFiles],
                });

                const fileUri = result.fileCopyUri.replace("file://", "");
                props.onSelect(fileUri);
            } catch (err) {
                if (DocumentPicker.isCancel(err)) {
                    // User cancelled the picker, exit any dialogs or menus and move on
                } else {
                    throw err;
                }
            }
        }
    };

    const clearCertificatePath = () => {
        props.onSelect(undefined);
    };

    const rightIcon = (
        <View style={{ width: 142 }}>
            {props.certificatePath ? (
                <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1 }}>
                        <Text>{props.certificatePath}</Text>
                    </View>
                    <Button
                        type="clear"
                        icon={<Icon name="cancel" size={24} />}
                        onPress={clearCertificatePath}
                    />
                </View>
            ) : (
                <Button title="Select" onPress={pickCertificate} />
            )}
        </View>
    );

    return (
        <Input
            placeholder={props.title}
            disabled={true}
            style={{ fontWeight: "bold", fontSize: 17, opacity: 1 }}
            containerStyle={{ height: 50 }}
            inputContainerStyle={{
                borderColor: "rgba(255,255,255,0)",
            }}
            rightIcon={rightIcon}
            labelStyle={{ flex: 12, flexWrap: "wrap", height: 100 }}
        />
    );
};

export default CertificateInput;
