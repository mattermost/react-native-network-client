// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { View } from "react-native";
import { Button, Input, Text } from "react-native-elements";
import DocumentPicker from "react-native-document-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import Icon from "react-native-vector-icons/MaterialIcons";

type P12InputsProps = {
    title: string;
    path: string;
    password?: string;
    onSelectP12: (path: string) => void;
    onPasswordChange: (password?: string) => void;
};

const P12Inputs = (props: P12InputsProps) => {
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

                props.onSelectP12(result.fileCopyUri);
            } catch (err) {
                if (DocumentPicker.isCancel(err)) {
                    // User cancelled the picker, exit any dialogs or menus and move on
                } else {
                    throw err;
                }
            }
        }
    };

    const clearP12Configuration = () => {
        props.onSelectP12("");
        props.onPasswordChange(undefined);
    };

    const rightIcon = (
        <View style={{ width: 142 }}>
            {props.path ? (
                <View style={{ flexDirection: "column", height: 50 }}>
                    <View style={{ flexDirection: "row" }}>
                        <View style={{ flex: 1 }}>
                            <Text numberOfLines={2} ellipsizeMode="middle">
                                {props.path}
                            </Text>
                        </View>
                        <Button
                            type="clear"
                            icon={<Icon name="cancel" size={24} />}
                            onPress={clearP12Configuration}
                        />
                    </View>
                    <Input
                        placeholder="password"
                        value={props.password}
                        onChangeText={props.onPasswordChange}
                        autoCapitalize="none"
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
            containerStyle={{ flex: 1, paddingBottom: props.path ? 15 : 0 }}
            inputContainerStyle={{
                borderColor: "rgba(255,255,255,0)",
            }}
            rightIcon={rightIcon}
            labelStyle={{ flex: 12, flexWrap: "wrap", height: 100 }}
        />
    );
};

export default P12Inputs;
