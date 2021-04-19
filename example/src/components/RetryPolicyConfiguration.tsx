// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import {
    Button,
    ButtonGroup,
    CheckBox,
    Input,
    ListItem,
} from "react-native-elements";
import { Constants } from "@mattermost/react-native-network-client";
import Icon from "react-native-vector-icons/Ionicons";

import NumericInput from "./NumericInput";

interface RetryPolicyConfigurationProps extends RetryPolicyConfiguration {
    policyType?: RetryTypes;
    onTypeSelected: (value?: RetryTypes) => void;
    setRetryLimit: (value: number) => void;
    setRetryInterval: (value: number) => void;
    setExponentialBackoffBase: (value: number) => void;
    setExponentialBackoffScale: (value: number) => void;
    setStatusCodes: (value: number[]) => void;
    setRetryMethods: (value: string[]) => void;
}

const RetryPolicyConfiguration = (props: RetryPolicyConfigurationProps) => {
    const onLinearPress = () =>
        onCheckBoxPress(Constants.RETRY_TYPES.LINEAR_RETRY);
    const onExponentialPress = () =>
        onCheckBoxPress(Constants.RETRY_TYPES.EXPONENTIAL_RETRY);
    const onCheckBoxPress = (policyType: RetryTypes) => {
        props.onTypeSelected(policyType);
    };
    const linearRetryChecked =
        props.policyType === Constants.RETRY_TYPES.LINEAR_RETRY;
    const exponentialRetryChecked =
        props.policyType === Constants.RETRY_TYPES.EXPONENTIAL_RETRY;

    const buttonMethods = ["get", "post", "put", "patch", "delete"];
    const [selectedMethodsIndex, setSelectedMethodsIndex] = useState<number[]>([
        0,
        1,
    ]);

    useEffect(() => {
        const selectedMethods = selectedMethodsIndex.map(
            (index) => buttonMethods[index]
        );
        props.setRetryMethods(selectedMethods);
    }, [selectedMethodsIndex]);

    const rightIcon = (
        <View style={{ flex: 1, flexDirection: "row" }}>
            <CheckBox
                title={`Linear [${linearRetryChecked}]`}
                checked={linearRetryChecked}
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
                title={`Exponential [${exponentialRetryChecked}]`}
                checked={exponentialRetryChecked}
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

    const addRetryStatusCode = () => {
        props.setStatusCodes([...props.statusCodes!, 418]);
    };

    const setCode = (index: number, code: number) => {
        props.statusCodes![index] = code;
        props.setStatusCodes(props.statusCodes!);
    };

    const RetryStatusCodeInput = (props: {
        code: number;
        index: number;
        setCode: (index: number, code: number) => void;
    }) => (
        <ListItem>
            <Input
                value={`${props.code}`}
                onChangeText={(text) =>
                    props.setCode(props.index, parseInt(text))
                }
                keyboardType="numeric"
                placeholder="418"
            />
        </ListItem>
    );

    return (
        <>
            <Input
                placeholder="Retry Status Codes"
                disabled={true}
                style={{ fontWeight: "bold", fontSize: 17, opacity: 1 }}
                containerStyle={{ height: 50 }}
                inputContainerStyle={{
                    borderColor: "rgba(255,255,255,0)",
                }}
                rightIcon={
                    <Button
                        type="clear"
                        icon={<Icon name="add-circle" size={24} />}
                        onPress={addRetryStatusCode}
                        testID="add_empty_header.button"
                    />
                }
            />

            <View style={{ paddingHorizontal: 10 }}>
                {props.statusCodes?.map((code, index) => (
                    <RetryStatusCodeInput
                        key={`retry-code-${index}`}
                        code={code}
                        index={index}
                        setCode={setCode}
                    />
                ))}
            </View>

            <Input
                placeholder="Retry Methods"
                disabled={true}
                style={{ fontWeight: "bold", fontSize: 17, opacity: 1 }}
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

            <NumericInput
                title="Retry limit"
                value={props.retryLimit}
                onChange={props.setRetryLimit}
                minValue={0}
                testID="retry_policy_configuration.retry_limit.input"
            />

            {props.policyType === Constants.RETRY_TYPES.LINEAR_RETRY && (
                <NumericInput
                    title="Retry interval"
                    value={props.retryInterval}
                    onChange={props.setRetryInterval}
                    minValue={1}
                    testID="retry_policy_configuration.retry_interval.input"
                />
            )}
            {props.policyType === Constants.RETRY_TYPES.EXPONENTIAL_RETRY && (
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
