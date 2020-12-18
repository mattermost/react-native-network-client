// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { CheckBox } from "react-native-elements";

import NumericInput from "./NumericInput";

type RetryPolicyConfigurationProps = {
    checked: boolean;
    onCheckBoxPress: () => void;
    retryLimit?: number;
    setRetryLimit: (value: number) => void;
    exponentialBackoffBase?: number;
    setExponentialBackoffBase: (value: number) => void;
    exponentialBackoffScale?: number;
    setExponentialBackoffScale: (value: number) => void;
};

const RetryPolicyConfiguration = ({
    checked,
    onCheckBoxPress,
    retryLimit,
    setRetryLimit,
    exponentialBackoffBase,
    setExponentialBackoffBase,
    exponentialBackoffScale,
    setExponentialBackoffScale,
}: RetryPolicyConfigurationProps) => (
    <>
        <CheckBox
            title="Retries with exponential backoff?"
            checked={checked}
            onPress={onCheckBoxPress}
            iconType="ionicon"
            checkedIcon="ios-checkmark-circle"
            uncheckedIcon="ios-checkmark-circle"
            iconRight
            textStyle={{ flex: 1 }}
        />
        {checked && (
            <>
                <NumericInput
                    title="Retry limit"
                    value={retryLimit}
                    onChange={setRetryLimit}
                    minValue={0}
                />
                <NumericInput
                    title="Exponential backoff base"
                    value={exponentialBackoffBase}
                    onChange={setExponentialBackoffBase}
                    minValue={2}
                />
                <NumericInput
                    title="Exponential backoff scale"
                    value={exponentialBackoffScale}
                    onChange={setExponentialBackoffScale}
                    minValue={0}
                    valueType="real"
                    step={0.1}
                />
            </>
        )}
    </>
);

export default RetryPolicyConfiguration;
