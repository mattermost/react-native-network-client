// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Input, ListItem } from "react-native-elements";

type HeaderListItemProps = {
    index: number;
    header: Header;
    updateHeader?: (header: Header, index: number) => void;
    disabled?: boolean;
};

const HeaderListItem = ({
    index,
    header,
    updateHeader,
    disabled,
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
            />
            <Input
                containerStyle={{ flex: 1 }}
                onChangeText={updateHeaderValue}
                placeholder="value"
                value={header.value}
                disabled={disabled}
            />
        </ListItem>
    );
};

export default HeaderListItem;
