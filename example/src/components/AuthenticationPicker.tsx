// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import { Constants } from "@mattermost/react-native-network-client";

const AUTHENTICATION_TYPES = {
    "-": "",
    Basic: Constants.BASIC_AUTHENTICATION,
    Bearer: Constants.BEARER_AUTHENTICATION,
    Cookie: Constants.COOKIE_AUTHENTICATION,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 40,
    },
    itemStyle: {
        justifyContent: "flex-start",
    },
});

type AuthenticationPickerProps = {
    onAuthenticationPicked: (authenticationType: string) => void;
};
export default function AuthenticationPicker({
    onAuthenticationPicked,
}: AuthenticationPickerProps) {
    const [authentication, setAuthentication] = useState(
        AUTHENTICATION_TYPES["-"]
    );
    const items = Object.entries(AUTHENTICATION_TYPES).map(
        ([label, value]) => ({
            label,
            value,
        })
    );
    const onChangeItem = (item: { label: string; value: string }) => {
        setAuthentication(item.value);
        onAuthenticationPicked(item.value);
    };

    return (
        <DropDownPicker
            items={items}
            onChangeItem={onChangeItem}
            defaultValue={authentication}
            placeholder="-"
            containerStyle={styles.container}
            itemStyle={styles.itemStyle}
        />
    );
}
