// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import NumericInput from "react-native-numeric-input";
import { Input } from "react-native-elements";

type ClientNumericInputProps = {
    title: string;
    value?: number;
    onChange: (value: number) => void;
    minValue?: number;
    valueType?: "integer" | "real";
    step?: number;
};

const ClientNumericInput = ({
    title,
    value,
    onChange,
    minValue,
    valueType,
    step,
}: ClientNumericInputProps) => {
    const rightIcon = (
        <NumericInput
            value={value}
            onChange={onChange}
            totalHeight={35}
            minValue={minValue}
            valueType={valueType}
            step={step}
        />
    );

    return (
        <Input
            placeholder={title}
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

export default ClientNumericInput;
