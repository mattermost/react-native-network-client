// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { isAndroid } from "@support/utils";

class RetryPolicyConfiguration {
    testID = {
        retryIntervalInput: "retry_policy_configuration.retry_interval.input",
        retryLimitInput: "retry_policy_configuration.retry_limit.input",
        exponentialBackoffBaseInput:
            "retry_policy_configuration.exponential_backoff_base.input",
        exponentialBackoffScaleInput:
            "retry_policy_configuration.exponential_backoff_scale.input",
    };

    exponentialRetryCheckboxFalse = element(by.text("Exponential [false]"));
    exponentialRetryCheckboxTrue = element(by.text("Exponential [true]"));
    linearRetryCheckboxFalse = element(by.text("Linear [false]"));
    linearRetryCheckboxTrue = element(by.text("Linear [true]"));
    retryIntervalInput = element(by.id(this.testID.retryIntervalInput));
    retryLimitInput = element(by.id(this.testID.retryLimitInput));
    exponentialBackoffBaseInput = element(
        by.id(this.testID.exponentialBackoffBaseInput)
    );
    exponentialBackoffScaleInput = element(
        by.id(this.testID.exponentialBackoffScaleInput)
    );

    setRetry = async ({
        retryPolicyType = "exponential",
        retryLimit = "2",
        exponentialBackoffBase = "2",
        exponentialBackoffScale = "0.5",
        retryInterval = "2000",
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
        retryLimit = "2",
        exponentialBackoffBase = "2",
        exponentialBackoffScale = "0.5",
    }) => {
        // # Toggle on exponential retry checkbox
        await this.toggleOnExponentialRetryCheckbox();

        // # Set retry limit
        await this.retryLimitInput.clearText();
        await this.retryLimitInput.replaceText(retryLimit);
        await this.retryLimitInput.tapReturnKey();

        // # Set exponential backoff base
        await this.exponentialBackoffBaseInput.clearText();
        await this.exponentialBackoffBaseInput.replaceText(
            exponentialBackoffBase
        );
        await this.exponentialBackoffBaseInput.tapReturnKey();

        // # Set exponential backoff scale
        await this.exponentialBackoffScaleInput.clearText();
        await this.exponentialBackoffScaleInput.replaceText(
            exponentialBackoffScale
        );
        await this.exponentialBackoffScaleInput.tapReturnKey();

        // * Verify input values
        if (isAndroid()) {
            await expect(this.retryLimitInput).toHaveText(retryLimit);
            await expect(this.exponentialBackoffBaseInput).toHaveText(
                exponentialBackoffBase
            );
            await expect(this.exponentialBackoffScaleInput).toHaveText(
                exponentialBackoffScale
            );
        } else {
            await expect(this.retryLimitInput).toHaveValue(retryLimit);
            await expect(this.exponentialBackoffBaseInput).toHaveValue(
                exponentialBackoffBase
            );
            await expect(this.exponentialBackoffScaleInput).toHaveValue(
                exponentialBackoffScale
            );
        }
    };

    setLinearRetry = async ({ retryLimit = "2", retryInterval = "2000" }) => {
        if (isAndroid()) {
            await expect(this.linearRetryCheckboxTrue).toBeVisible();
        } else {
            // # Toggle on linear retry checkbox
            await this.toggleOnLinearRetryCheckbox();
        }

        // # Set retry limit
        await this.retryLimitInput.clearText();
        await this.retryLimitInput.replaceText(retryLimit);
        await this.retryLimitInput.tapReturnKey();

        // # Set retry interval
        await this.retryIntervalInput.clearText();
        await this.retryIntervalInput.replaceText(retryInterval);
        await this.retryIntervalInput.tapReturnKey();

        // * Verify input values
        if (isAndroid()) {
            await expect(this.retryLimitInput).toHaveText(retryLimit);
            await expect(this.retryIntervalInput).toHaveText(retryInterval);
        } else {
            await expect(this.retryLimitInput).toHaveValue(retryLimit);
            await expect(this.retryIntervalInput).toHaveValue(retryInterval);
        }
    };

    toggleOffExponentialRetryCheckbox = async () => {
        await this.exponentialRetryCheckboxTrue.tap();
        await expect(this.exponentialRetryCheckboxFalse).toBeVisible();
    };

    toggleOnExponentialRetryCheckbox = async () => {
        await this.exponentialRetryCheckboxFalse.tap();
        await expect(this.exponentialRetryCheckboxTrue).toBeVisible();
    };

    toggleOffLinearRetryCheckbox = async () => {
        await this.linearRetryCheckboxTrue.tap();
        await expect(this.linearRetryCheckboxFalse).toBeVisible();
    };

    toggleOnLinearRetryCheckbox = async () => {
        await this.linearRetryCheckboxFalse.tap();
        await expect(this.linearRetryCheckboxTrue).toBeVisible();
    };
}

const retryPolicyConfiguration = new RetryPolicyConfiguration();
export default retryPolicyConfiguration;
