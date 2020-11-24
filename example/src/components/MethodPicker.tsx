// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { Dispatch, SetStateAction, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 40,
    },
    itemStyle: {
        justifyContent: "flex-start",
    },
});

export enum METHOD {
    GET = "GET",
    PUT = "PUT",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
}

type MethodPickerProps = {
    wrapperStyle: StyleProp<ViewStyle>;
    onMethodPicked: Dispatch<SetStateAction<string>>;
};
export default function MethodPicker({
    wrapperStyle,
    onMethodPicked,
}: MethodPickerProps) {
    const [method, setMethod] = useState(METHOD.GET);
    const items = Object.values(METHOD).map((method) => ({
        label: method,
        value: method,
    }));
    const onChangeItem = (item: { label: METHOD; value: METHOD }) => {
        setMethod(item.value);
        onMethodPicked(item.value);
    };

    return (
        <View style={wrapperStyle}>
            <DropDownPicker
                items={items}
                defaultValue={method}
                onChangeItem={onChangeItem}
                containerStyle={styles.container}
                itemStyle={styles.itemStyle}
            />
        </View>
    );
}
