// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    AddHeaders,
    ResponseSuccessOverlay,
    RetryPolicyConfiguration,
} from "@support/ui/component";
import { isAndroid } from "@support/utils";

class ApiClientRequestScreen {
    testID = {
        bodyInput: "api_client_request.body.input",
        pathInput: "api_client_request.path.input",
        timeoutIntervalInput: "api_client_request.timeout_interval.input",
    };

    apiClientRequestScreen = element(by.text("APIClientRequest"));
    bodyInput = element(by.id(this.testID.bodyInput));
    pathInput = element(by.id(this.testID.pathInput));
    timeoutIntervalInput = element(by.id(this.testID.timeoutIntervalInput));
    apiClientButton = element(by.text("APIClient")).atIndex(0);
    requestButton = element(by.text("Request"));

    // convenience props
    responseCodeText = ResponseSuccessOverlay.responseCodeText;
    responseDataText = ResponseSuccessOverlay.responseDataText;
    responseHeadersText = ResponseSuccessOverlay.responseHeadersText;
    responseLastRequestedUrlText =
        ResponseSuccessOverlay.responseLastRequestedUrlText;
    responseOkText = ResponseSuccessOverlay.responseOkText;
    responseRetriesExhaustedText =
        ResponseSuccessOverlay.responseRetriesExhaustedText;

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
        await this.requestButton.tap();
    };

    setBody = async (body) => {
        await this.bodyInput.clearText();
        await this.bodyInput.replaceText(body);
        await this.bodyInput.tapReturnKey();
    };

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    };

    setPath = async (url) => {
        await this.pathInput.clearText();
        await this.pathInput.replaceText(url);
        await this.pathInput.tapReturnKey();
    };

    setRetry = async (
        options = {
            retryPolicyType: "exponential",
            retryLimit: "2",
            exponentialBackoffBase: "2",
            exponentialBackoffScale: "0.5",
            retryInterval: "2000",
        }
    ) => {
        await RetryPolicyConfiguration.setRetry(options);
    };

    setTimeoutInterval = async (timeoutInterval) => {
        await this.timeoutIntervalInput.clearText();
        await this.timeoutIntervalInput.replaceText(timeoutInterval);
        await this.timeoutIntervalInput.tapReturnKey();
    };
}

const apiClientRequestScreen = new ApiClientRequestScreen();
export default apiClientRequestScreen;
