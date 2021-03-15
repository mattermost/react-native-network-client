// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Input, ListItem } from "react-native-elements";

type HeaderListItemProps = {
    index: number;
    header: Header;
    updateHeader?: (header: Header, index: number) => void;
    disabled?: boolean;
    testID?: string;
};

const HeaderListItem = ({
    index,
    header,
    updateHeader,
    disabled,
    testID,
}: HeaderListItemProps) => {
    const updateHeaderKey = (key: string) =>
        updateHeader && updateHeader({ ...header, key }, index);
    const updateHeaderValue = (value: string) =>
        updateHeader && updateHeader({ ...header, value }, index);

    return (
        <ListItem>
            <Input
                containerStyle={{ flex: 1 }}
                onChangeText={updateHeaderKey}
                placeholder="key"
                value={header.key}
                disabled={disabled}
                testID={`${testID}.${index}.key.input`}
            />
            <Input
                containerStyle={{ flex: 1 }}
                onChangeText={updateHeaderValue}
                placeholder="value"
                value={header.value}
                disabled={disabled}
                testID={`${testID}.${index}.value.input`}
            />
        </ListItem>
    );
};

export default HeaderListItem;
