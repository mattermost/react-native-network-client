// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { AddHeaders, RetryPolicyConfiguration } from "@support/ui/component";
import { isAndroid, waitForAndScrollDown } from "@support/utils";

class ApiClientRequestScreen {
    testID = {
        apiClientRequestScrollView: "api_client_request.scroll_view",
        bodyInput: "api_client_request.body.input",
        pathInput: "api_client_request.path.input",
        timeoutIntervalInput: "api_client_request.timeout_interval.input",
    };

    apiClientRequestScreen = element(by.text("APIClientRequest"));
    apiClientRequestScrollView = element(
        by.id(this.testID.apiClientRequestScrollView)
    );
    apiClientButton = element(by.text("APIClient")).atIndex(0);
    bodyInput = element(by.id(this.testID.bodyInput));
    pathInput = element(by.id(this.testID.pathInput));
    timeoutIntervalInput = element(by.id(this.testID.timeoutIntervalInput));
    requestButton = element(by.text("Request"));

    retryPolicyConfiguration = new RetryPolicyConfiguration(
        this.testID.apiClientRequestScrollView
    );

    toBeVisible = async () => {
        await expect(this.apiClientRequestScreen).toBeVisible();

        return this.apiClientRequestScreen;
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.apiClientButton.tap();
        }
        await expect(this.apiClientRequestScreen).not.toBeVisible();
    };

    makeRequest = async () => {
        await waitForAndScrollDown(
            this.requestButton,
            this.testID.apiClientRequestScrollView
        );
        await this.requestButton.tap();
    };

    setBody = async (body) => {
        await waitForAndScrollDown(
            this.bodyInput,
            this.testID.apiClientRequestScrollView
        );
        await this.bodyInput.clearText();
        await this.bodyInput.replaceText(body);
        await this.bodyInput.tapReturnKey();
    };

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    };

    setPath = async (url) => {
        await waitForAndScrollDown(
            this.pathInput,
            this.testID.apiClientRequestScrollView
        );
        await this.pathInput.clearText();
        await this.pathInput.replaceText(url);
        await this.pathInput.tapReturnKey();
    };

    setRetry = async (
        options = {
            retryPolicyType: "exponential",
            retryLimit: 2,
            exponentialBackoffBase: 2,
            exponentialBackoffScale: 0.5,
            retryInterval: 2000,
        }
    ) => {
        await this.retryPolicyConfiguration.setRetry(options);
    };

    setTimeoutInterval = async (timeoutInterval) => {
        const timeoutIntervalStr = timeoutInterval.toString();
        await waitForAndScrollDown(
            this.timeoutIntervalInput,
            this.testID.apiClientRequestScrollView
        );
        await this.timeoutIntervalInput.clearText();
        await this.timeoutIntervalInput.replaceText(timeoutIntervalStr);
        await this.timeoutIntervalInput.tapReturnKey();
    };
}

const apiClientRequestScreen = new ApiClientRequestScreen();
export default apiClientRequestScreen;
