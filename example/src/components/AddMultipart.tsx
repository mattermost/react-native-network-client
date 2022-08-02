// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type { Dispatch } from "react";
import type { SetStateAction } from "react";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Input } from "react-native-elements";
import Icon from "react-native-vector-icons/Ionicons";

import MultipartListItem from "./MultipartListItem";

type AddMultipartsProps = {
    onMultipartsChanged: Dispatch<SetStateAction<Record<string, string>>>;
};

const AddMultiparts = (props: AddMultipartsProps) => {
    const [multiparts, setMultiparts] = useState<Multipart[]>([
        { key: "", value: "" },
    ]);

    const removeMultipart = (index: number) => {
        const multis = [...multiparts];
        multis.splice(index, 1);
        setMultiparts(multis);
    };

    const addEmptyMultipart = () =>
        setMultiparts([...multiparts, { key: "", value: "" }]);

    const updateMultipart = (multipart: Multipart, index: number) => {
        const updatedMultiparts = [...multiparts];
        updatedMultiparts[index] = multipart;
        setMultiparts(updatedMultiparts);

        const mdata = updatedMultiparts.reduce<Record<string, string>>(
            (prev, cur) => {
                prev[cur.key] = cur.value;
                return prev;
            },
            {}
        );

        props.onMultipartsChanged(mdata);
    };

    const rightIcon = (
        <Button
            type="clear"
            icon={<Icon name="add-circle" size={24} />}
            onPress={addEmptyMultipart}
            testID="add_empty_multipart.button"
        />
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
                    autoCompleteType={undefined}
                    placeholder="Multiparts"
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
                {multiparts.map((multipart, index) => (
                    <MultipartListItem
                        key={`multipart-${index}`}
                        multipart={multipart}
                        index={index}
                        updateMultipart={updateMultipart}
                        removeMultipart={removeMultipart}
                        testID="add_multiparts.multipart_list_item"
                    />
                ))}
            </View>
        </>
    );
};

export default AddMultiparts;
