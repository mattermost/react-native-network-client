// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { CheckBox } from "react-native-elements";

import NumericInput from "./NumericInput";

interface RetryPolicyConfigurationProps extends RetryPolicyConfiguration {
    checked: boolean;
    onCheckBoxPress: () => void;
    setRetryLimit: (value: number) => void;
    setExponentialBackoffBase: (value: number) => void;
    setExponentialBackoffScale: (value: number) => void;
}

const RetryPolicyConfiguration = (props: RetryPolicyConfigurationProps) => (
    <>
        <CheckBox
            title="Retries with exponential backoff?"
            checked={props.checked}
            onPress={props.onCheckBoxPress}
            iconType="ionicon"
            checkedIcon="ios-checkmark-circle"
            uncheckedIcon="ios-checkmark-circle"
            iconRight
            textStyle={{ flex: 1 }}
        />
        {props.checked && (
            <>
                <NumericInput
                    title="Retry limit"
                    value={props.retryLimit}
                    onChange={props.setRetryLimit}
                    minValue={0}
                />
                <NumericInput
                    title="Exponential backoff base"
                    value={props.exponentialBackoffBase}
                    onChange={props.setExponentialBackoffBase}
                    minValue={2}
                />
                <NumericInput
                    title="Exponential backoff scale"
                    value={props.exponentialBackoffScale}
                    onChange={props.setExponentialBackoffScale}
                    minValue={0}
                    valueType="real"
                    step={0.1}
                />
            </>
        )}
    </>
);

export default RetryPolicyConfiguration;
