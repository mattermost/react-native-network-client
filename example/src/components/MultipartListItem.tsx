// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Input, ListItem, Button } from "react-native-elements";
import Icon from "react-native-vector-icons/Ionicons";

type MultipartListItemProps = {
    index: number;
    multipart: Multipart;
    updateMultipart: (multipart: Multipart, index: number) => void;
    removeMultipart: (index: number) => void;
    disabled?: boolean;
    testID?: string;
};

const MultipartListItem = ({
    index,
    multipart,
    updateMultipart,
    removeMultipart,
    disabled,
    testID,
}: MultipartListItemProps) => {
    const updateMultipartKey = (key: string) =>
        updateMultipart && updateMultipart({ ...multipart, key }, index);
    const updateMultipartValue = (value: string) =>
        updateMultipart && updateMultipart({ ...multipart, value }, index);

    return (
        <ListItem>
            <Input
                containerStyle={{ flex: 1 }}
                onChangeText={updateMultipartKey}
                placeholder="key"
                value={multipart.key}
                disabled={disabled}
                testID={`${testID}.${index}.key.input`}
            />
            <Input
                containerStyle={{ flex: 1 }}
                onChangeText={updateMultipartValue}
                placeholder="value"
                value={multipart.value}
                disabled={disabled}
                testID={`${testID}.${index}.value.input`}
            />
            <Button
                type="clear"
                icon={<Icon name="trash" size={24} />}
                onPress={() => removeMultipart(index)}
                testID="remove_multipart.button"
            />
        </ListItem>
    );
};

export default MultipartListItem;
