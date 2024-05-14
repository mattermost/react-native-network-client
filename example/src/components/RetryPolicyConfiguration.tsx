// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ButtonGroup, CheckBox, Input } from "react-native-elements";

import NumericInput from "./NumericInput";

import {
    RetryTypes,
    type RetryPolicyConfiguration as RetryPolicyConfigurationType,
} from "@mattermost/react-native-network-client";

interface RetryPolicyConfigurationProps extends RetryPolicyConfigurationType {
    policyType?: RetryTypes;
    onTypeSelected: (value?: RetryTypes) => void;
    setRetryLimit: (value: number) => void;
    setRetryInterval: (value: number) => void;
    setExponentialBackoffBase: (value: number) => void;
    setExponentialBackoffScale: (value: number) => void;
    setStatusCodes: (value: number[]) => void;
    setRetryMethods?: (value: string[]) => void;
}

const RetryPolicyConfiguration = (props: RetryPolicyConfigurationProps) => {
    const [statusCodesText, setStatusCodesText] = useState(
        props.statusCodes?.join(",") || ""
    );

    const onLinearPress = () =>
        onCheckBoxPress(
            props.policyType === RetryTypes.LINEAR_RETRY
                ? undefined
                : RetryTypes.LINEAR_RETRY
        );
    const onExponentialPress = () =>
        onCheckBoxPress(
            props.policyType === RetryTypes.EXPONENTIAL_RETRY
                ? undefined
                : RetryTypes.EXPONENTIAL_RETRY
        );
    const onCheckBoxPress = (policyType?: RetryTypes) => {
        props.onTypeSelected(policyType);
    };
    const linearRetryChecked =
        props.policyType === RetryTypes.LINEAR_RETRY;
    const exponentialRetryChecked =
        props.policyType === RetryTypes.EXPONENTIAL_RETRY;

    const buttonMethods = ["get", "post", "put", "patch", "delete"];
    const [selectedMethodsIndex, setSelectedMethodsIndex] = useState<number[]>([
        0,
        1,
    ]);

    if (props.setRetryMethods !== undefined) {
        useEffect(() => {
            const selectedMethods = selectedMethodsIndex.map(
                (index) => buttonMethods[index]
            );
            props.setRetryMethods!(selectedMethods);
        }, [selectedMethodsIndex]);
    }

    const PolicyTypeCheckbox = () => (
        <View style={{ flex: 1, flexDirection: "row" }}>
            <CheckBox
                title={`Linear [${linearRetryChecked}]`}
                checked={linearRetryChecked}
                onPress={onLinearPress}
                iconType="ionicon"
                checkedIcon="checkmark-circle"
                uncheckedIcon="checkmark-circle"
                iconRight
                containerStyle={{
                    padding: 0,
                    borderWidth: 0,
                    backgroundColor: "transparent",
                }}
            />
            <CheckBox
                title={`Exponential [${exponentialRetryChecked}]`}
                checked={exponentialRetryChecked}
                onPress={onExponentialPress}
                iconType="ionicon"
                checkedIcon="checkmark-circle"
                uncheckedIcon="checkmark-circle"
                iconRight
                containerStyle={{
                    padding: 0,
                    borderWidth: 0,
                    backgroundColor: "transparent",
                }}
            />
        </View>
    );

    const updateStatusCodes = () => {
        const statusCodes = statusCodesText
            .split(",")
            .map((code) => {
                return parseInt(code.trim());
            })
            .filter((code) => !isNaN(code));

        props.setStatusCodes(statusCodes);
    };

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
                labelStyle={{ flex: 12, flexWrap: "wrap", height: 100 }}
            />

            <PolicyTypeCheckbox />

            {props.policyType && (
                <NumericInput
                    title="Retry limit"
                    value={props.retryLimit}
                    onChange={props.setRetryLimit}
                    minValue={0}
                    testID="retry_policy_configuration.retry_limit.input"
                />
            )}

            {props.policyType === RetryTypes.LINEAR_RETRY && (
                <NumericInput
                    title="Retry interval"
                    value={props.retryInterval}
                    onChange={props.setRetryInterval}
                    minValue={1}
                    testID="retry_policy_configuration.retry_interval.input"
                />
            )}
            {props.policyType === RetryTypes.EXPONENTIAL_RETRY && (
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

            {props.policyType && (
                <>
                    <Input
                        placeholder="Retry Status Codes"
                        disabled={true}
                        style={{ fontWeight: "bold", fontSize: 17, opacity: 1 }}
                        containerStyle={{ height: 50 }}
                        inputContainerStyle={{
                            borderColor: "rgba(255,255,255,0)",
                        }}
                    />

                    <Input
                        value={statusCodesText}
                        onChangeText={setStatusCodesText}
                        onBlur={updateStatusCodes}
                    />

                    {props.setRetryMethods && (
                        <>
                            <Input
                                placeholder="Retry Methods"
                                disabled={true}
                                style={{
                                    fontWeight: "bold",
                                    fontSize: 17,
                                    opacity: 1,
                                }}
                                containerStyle={{ height: 50 }}
                                inputContainerStyle={{
                                    borderColor: "rgba(255,255,255,0)",
                                }}
                            />

                            <ButtonGroup
                                selectedIndexes={selectedMethodsIndex}
                                // @ts-ignore
                                onPress={setSelectedMethodsIndex}
                                buttons={buttonMethods}
                                selectMultiple
                            />
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default RetryPolicyConfiguration;
