// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { View } from "react-native";
import { Input } from "react-native-elements";

import HeaderListItem from "./HeaderListItem";

type ListHeadersProps = {
    headers: Header[];
};

const ListHeaders = ({ headers }: ListHeadersProps) => (
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
            />
        </View>
        <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
            {headers.map((header, index) => (
                <HeaderListItem
                    key={`header-${index}`}
                    header={header}
                    index={index}
                    disabled={true}
                    testID="list_headers.header_list_item"
                />
            ))}
        </View>
    </>
);

export default ListHeaders;
