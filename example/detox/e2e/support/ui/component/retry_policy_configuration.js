// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { isAndroid, waitForAndScrollDown } from "@support/utils";

class RetryPolicyConfiguration {
    constructor(screenScrollView) {
        this.testID = {
            screenScrollView,
            exponentialBackoffBaseInput:
                "retry_policy_configuration.exponential_backoff_base.input",
            exponentialBackoffScaleInput:
                "retry_policy_configuration.exponential_backoff_scale.input",
            retryIntervalInput:
                "retry_policy_configuration.retry_interval.input",
            retryLimitInput: "retry_policy_configuration.retry_limit.input",
        };
    }

    exponentialRetryCheckboxFalse = element(by.text("Exponential [false]"));
    exponentialRetryCheckboxTrue = element(by.text("Exponential [true]"));
    linearRetryCheckboxFalse = element(by.text("Linear [false]"));
    linearRetryCheckboxTrue = element(by.text("Linear [true]"));

    getExponentialBackoffBaseInput = () => {
        return element(by.id(this.testID.exponentialBackoffBaseInput));
    };

    getExponentialBackoffScaleInput = () => {
        return element(by.id(this.testID.exponentialBackoffScaleInput));
    };

    getRetryIntervalInput = () => {
        return element(by.id(this.testID.retryIntervalInput));
    };

    getRetryLimitInput = () => {
        return element(by.id(this.testID.retryLimitInput));
    };

    setRetry = async ({
        retryPolicyType = "exponential",
        retryLimit = 2,
        exponentialBackoffBase = 2,
        exponentialBackoffScale = 0.5,
        retryInterval = 2000,
    }) => {
        switch (retryPolicyType) {
            case "exponential":
                await this.setExponentialRetry({
                    retryLimit,
                    exponentialBackoffBase,
                    exponentialBackoffScale,
                });
                break;
            case "linear":
                await this.setLinearRetry({ retryLimit, retryInterval });
                break;
            default:
                throw new Error(
                    `Invalid retry policy type: ${retryPolicyType}`
                );
        }
    };

    setExponentialRetry = async ({
        retryLimit = 2,
        exponentialBackoffBase = 2,
        exponentialBackoffScale = 0.5,
    }) => {
        // # Toggle on exponential retry checkbox
        await this.toggleOnExponentialRetryCheckbox();

        // # Set retry limit
        await this.setRetryLimit(retryLimit);

        // # Set exponential backoff base
        await this.setExponentialBackoffBase(exponentialBackoffBase);

        // # Set exponential backoff scale
        await this.setExponentialBackoffScale(exponentialBackoffScale);
    };

    setLinearRetry = async ({ retryLimit = 2, retryInterval = 2000 }) => {
        // # Toggle on linear retry checkbox
        await this.toggleOnLinearRetryCheckbox();

        // # Set retry limit
        await this.setRetryLimit(retryLimit);

        // # Set retry interval
        await this.setRetryInterval(retryInterval);
    };

    setExponentialBackoffBase = async (exponentialBackoffBase) => {
        const exponentialBackoffBaseStr = exponentialBackoffBase.toString();
        const exponentialBackoffBaseInput = this.getExponentialBackoffBaseInput();
        await waitForAndScrollDown(
            exponentialBackoffBaseInput,
            this.testID.screenScrollView
        );
        await exponentialBackoffBaseInput.clearText();
        await exponentialBackoffBaseInput.replaceText(
            exponentialBackoffBaseStr
        );
        await exponentialBackoffBaseInput.tapReturnKey();

        // * Verify input value
        if (isAndroid()) {
            await expect(exponentialBackoffBaseInput).toHaveText(
                exponentialBackoffBaseStr
            );
        } else {
            await expect(exponentialBackoffBaseInput).toHaveValue(
                exponentialBackoffBaseStr
            );
        }
    };

    setExponentialBackoffScale = async (exponentialBackoffScale) => {
        const exponentialBackoffScaleStr = exponentialBackoffScale.toString();
        const exponentialBackoffScaleInput = this.getExponentialBackoffScaleInput();
        await waitForAndScrollDown(
            exponentialBackoffScaleInput,
            this.testID.screenScrollView
        );
        await exponentialBackoffScaleInput.clearText();
        await exponentialBackoffScaleInput.replaceText(
            exponentialBackoffScaleStr
        );
        await exponentialBackoffScaleInput.tapReturnKey();

        // * Verify input value
        if (isAndroid()) {
            await expect(exponentialBackoffScaleInput).toHaveText(
                exponentialBackoffScaleStr
            );
        } else {
            await expect(exponentialBackoffScaleInput).toHaveValue(
                exponentialBackoffScaleStr
            );
        }
    };

    setRetryInterval = async (retryInterval) => {
        const retryIntervalStr = retryInterval.toString();
        const retryIntervalInput = this.getRetryIntervalInput();
        await waitForAndScrollDown(
            retryIntervalInput,
            this.testID.screenScrollView
        );
        await retryIntervalInput.clearText();
        await retryIntervalInput.replaceText(retryIntervalStr);
        await retryIntervalInput.tapReturnKey();

        // * Verify input value
        if (isAndroid()) {
            await expect(retryIntervalInput).toHaveText(retryIntervalStr);
        } else {
            await expect(retryIntervalInput).toHaveValue(retryIntervalStr);
        }
    };

    setRetryLimit = async (retryLimit) => {
        const retryLimitStr = retryLimit.toString();
        const retryLimitInput = this.getRetryLimitInput();
        await waitForAndScrollDown(
            retryLimitInput,
            this.testID.screenScrollView
        );
        await retryLimitInput.clearText();
        await retryLimitInput.replaceText(retryLimitStr);
        await retryLimitInput.tapReturnKey();

        // * Verify input value
        if (isAndroid()) {
            await expect(retryLimitInput).toHaveText(retryLimitStr);
        } else {
            await expect(retryLimitInput).toHaveValue(retryLimitStr);
        }
    };

    toggleOffExponentialRetryCheckbox = async () => {
        await waitForAndScrollDown(
            this.exponentialRetryCheckboxTrue,
            this.testID.screenScrollView
        );
        await this.exponentialRetryCheckboxTrue.tap();
        await expect(this.exponentialRetryCheckboxFalse).toBeVisible();
    };

    toggleOnExponentialRetryCheckbox = async () => {
        await waitForAndScrollDown(
            this.exponentialRetryCheckboxFalse,
            this.testID.screenScrollView
        );
        await this.exponentialRetryCheckboxFalse.tap();
        await expect(this.exponentialRetryCheckboxTrue).toBeVisible();
    };

    toggleOffLinearRetryCheckbox = async () => {
        await waitForAndScrollDown(
            this.linearRetryCheckboxTrue,
            this.testID.screenScrollView
        );
        await this.linearRetryCheckboxTrue.tap();
        await expect(this.linearRetryCheckboxFalse).toBeVisible();
    };

    toggleOnLinearRetryCheckbox = async () => {
        await waitForAndScrollDown(
            this.linearRetryCheckboxFalse,
            this.testID.screenScrollView
        );
        await this.linearRetryCheckboxFalse.tap();
        await expect(this.linearRetryCheckboxTrue).toBeVisible();
    };
}

export default RetryPolicyConfiguration;
