// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { View } from "react-native";
import { Button, Input } from "react-native-elements";
import Icon from "react-native-vector-icons/Ionicons";

import HeaderListItem from "./HeaderListItem";

type AddHeadersProps = {
    onHeadersChanged: (headers: Header[]) => void;
};

const AddHeaders = ({ onHeadersChanged }: AddHeadersProps) => {
    const [headers, setHeaders] = useState<Header[]>([{ key: "", value: "" }]);
    const addEmptyHeader = () =>
        setHeaders([...headers, { key: "", value: "" }]);
    const updateHeader = (header: Header, index: number) => {
        const updatedHeaders = [...headers];
        updatedHeaders[index] = header;
        setHeaders(updatedHeaders);
        onHeadersChanged(updatedHeaders);
    };

    const rightIcon = (
        <Button
            type="clear"
            icon={<Icon name="add-circle" size={24} />}
            onPress={addEmptyHeader}
        ></Button>
    );

    return (
        <>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Input
                    placeholder="Headers"
                    disabled={true}
                    style={{ fontWeight: "bold", fontSize: 17, opacity: 1 }}
                    containerStyle={{ height: 50 }}
                    inputContainerStyle={{
                        borderColor: "rgba(255,255,255,0)",
                    }}
                    rightIcon={rightIcon}
                />
            </View>
            <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
                {headers.map((header, index) => (
                    <HeaderListItem
                        key={`header-${index}`}
                        header={header}
                        index={index}
                        updateHeader={updateHeader}
                    />
                ))}
            </View>
        </>
    );
};

export default AddHeaders;
