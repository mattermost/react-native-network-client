// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { View } from "react-native";
import { CheckBox, Input } from "react-native-elements";
import { Constants } from "@mattermost/react-native-network-client";

import NumericInput from "./NumericInput";

interface RetryPolicyConfigurationProps extends RetryPolicyConfiguration {
    policyType?: keyof Constants;
    retryLimit?: number;
    retryInterval?: number;
    exponentialBackoffBase?: number;
    exponentialBackoffScale?: number;
    onTypeSelected: (value?: keyof Constants) => void;
    setRetryLimit: (value: number) => void;
    setRetryInterval: (value: number) => void;
    setExponentialBackoffBase: (value: number) => void;
    setExponentialBackoffScale: (value: number) => void;
}

const RetryPolicyConfiguration = (props: RetryPolicyConfigurationProps) => {
    const onLinearPress = () => onCheckBoxPress(Constants.LINEAR_RETRY);
    const onExponentialPress = () =>
        onCheckBoxPress(Constants.EXPONENTIAL_RETRY);
    const onCheckBoxPress = (policyType: keyof Constants) => {
        if (policyType === props.policyType) {
            props.onTypeSelected(undefined);
        } else {
            props.onTypeSelected(policyType);
        }
    };

    const rightIcon = (
        <View style={{ flex: 1, flexDirection: "row" }}>
            <CheckBox
                title="Linear"
                checked={props.policyType === Constants.LINEAR_RETRY}
                onPress={onLinearPress}
                iconType="ionicon"
                checkedIcon="ios-checkmark-circle"
                uncheckedIcon="ios-checkmark-circle"
                iconRight
                containerStyle={{
                    padding: 0,
                    borderWidth: 0,
                    backgroundColor: "transparent",
                }}
            />
            <CheckBox
                title="Exponential"
                checked={props.policyType === Constants.EXPONENTIAL_RETRY}
                onPress={onExponentialPress}
                iconType="ionicon"
                checkedIcon="ios-checkmark-circle"
                uncheckedIcon="ios-checkmark-circle"
                iconRight
                containerStyle={{
                    padding: 0,
                    borderWidth: 0,
                    backgroundColor: "transparent",
                }}
            />
        </View>
    );

    return (
        <>
            <Input
                placeholder="Retry Policy"
                disabled={true}
                style={{ fontWeight: "bold", fontSize: 17, opacity: 1 }}
                containerStyle={{ height: 50 }}
                inputContainerStyle={{
                    borderColor: "rgba(255,255,255,0)",
                }}
                rightIcon={rightIcon}
                labelStyle={{ flex: 12, flexWrap: "wrap", height: 100 }}
            />
            {props.policyType && (
                <NumericInput
                    title="Retry limit"
                    value={props.retryLimit}
                    onChange={props.setRetryLimit}
                    minValue={0}
                    testID="retry_policy_configuration.retry_limit.input"
                />
            )}
            {props.policyType === Constants.LINEAR_RETRY && (
                <NumericInput
                    title="Retry interval"
                    value={props.retryInterval}
                    onChange={props.setRetryInterval}
                    minValue={1}
                    testID="retry_policy_configuration.retry_interval.input"
                />
            )}
            {props.policyType === Constants.EXPONENTIAL_RETRY && (
                <>
                    <NumericInput
                        title="Exponential backoff base"
                        value={props.exponentialBackoffBase}
                        onChange={props.setExponentialBackoffBase}
                        minValue={2}
                        testID="retry_policy_configuration.exponential_backoff_base.input"
                    />
                    <NumericInput
                        title="Exponential backoff scale"
                        value={props.exponentialBackoffScale}
                        onChange={props.setExponentialBackoffScale}
                        minValue={0}
                        valueType="real"
                        step={0.1}
                        testID="retry_policy_configuration.exponential_backoff_scale.input"
                    />
                </>
            )}
        </>
    );
};

export default RetryPolicyConfiguration;
