// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isAndroid} from '@support/utils';

class RetryPolicyConfiguration {
    testID = {
        retryLimitInput: 'retry_policy_configuration.retry_limit.input',
        exponentialBackoffBaseInput: 'retry_policy_configuration.exponential_backoff_base.input',
        exponentialBackoffScaleInput: 'retry_policy_configuration.exponential_backoff_scale.input',
    }

    retryCheckbox = element(by.text('Retries with exponential backoff?'));
    retryLimitInput = element(by.id(this.testID.retryLimitInput));
    exponentialBackoffBaseInput = element(by.id(this.testID.exponentialBackoffBaseInput));
    exponentialBackoffScaleInput = element(by.id(this.testID.exponentialBackoffScaleInput));

    setRetry = async ({retryLimit = '2', exponentialBackoffBase = '2', exponentialBackoffScale = '0.5'}) => {
        await this.retryCheckbox.tap();

        // # Set retry limit
        await this.retryLimitInput.clearText();
        await this.retryLimitInput.replaceText(retryLimit);
        await this.retryLimitInput.tapReturnKey();

        // # Set exponential backoff base
        await this.exponentialBackoffBaseInput.clearText();
        await this.exponentialBackoffBaseInput.replaceText(exponentialBackoffBase);
        await this.exponentialBackoffBaseInput.tapReturnKey();

        // # Set exponential backoff scale
        await this.exponentialBackoffScaleInput.clearText();
        await this.exponentialBackoffScaleInput.replaceText(exponentialBackoffScale);
        await this.exponentialBackoffScaleInput.tapReturnKey();

        // * Verify input values
        if (isAndroid()) {
            await expect(this.retryLimitInput).toHaveText(retryLimit);
            await expect(this.exponentialBackoffBaseInput).toHaveText(exponentialBackoffBase);
            await expect(this.exponentialBackoffScaleInput).toHaveText(exponentialBackoffScale);
        } else {
            await expect(this.retryLimitInput).toHaveValue(retryLimit);
            await expect(this.exponentialBackoffBaseInput).toHaveValue(exponentialBackoffBase);
            await expect(this.exponentialBackoffScaleInput).toHaveValue(exponentialBackoffScale);
        }
    }
}

const retryPolicyConfiguration = new RetryPolicyConfiguration();
export default retryPolicyConfiguration;
