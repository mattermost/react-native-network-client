// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    AddHeaders,
    ResponseOverlay,
    RetryPolicyConfiguration,
} from '@support/ui/component';

class ApiClientRequestScreen {
    testID = {
        bodyInput: 'api_client_request.body.input',
        pathInput: 'api_client_request.path.input',
        timeoutIntervalInput: 'api_client_request.timeout_interval.input',
    }

    apiClientRequestScreen = element(by.text('APIClientRequest'));
    bodyInput = element(by.id(this.testID.bodyInput));
    pathInput = element(by.id(this.testID.pathInput));
    timeoutIntervalInput = element(by.id(this.testID.timeoutIntervalInput));
    apiClientButton = element(by.text('APIClient')).atIndex(0);
    requestButton = element(by.text('Request'));
    responseCodeText = ResponseOverlay.responseCodeText;
    responseDataText = ResponseOverlay.responseDataText;
    responseHeadersText = ResponseOverlay.responseHeadersText;
    responseLastRequestedUrlText = ResponseOverlay.responseLastRequestedUrlText;

    toBeVisible = async () => {
        await expect(this.apiClientRequestScreen).toBeVisible();

        return this.apiClientRequestScreen;
    }

    back = async () => {
        await this.apiClientButton.tap();
        await expect(this.apiClientRequestScreen).not.toBeVisible();
    }

    makeRequest = async () => {
        await this.requestButton.multiTap(2);
    }

    setBody = async (body) => {
        await this.bodyInput.clearText();
        await this.bodyInput.replaceText(body);
    }

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    }

    setPath = async (url) => {
        await this.pathInput.clearText();
        await this.pathInput.replaceText(url);
    }

    setRetry = async (options = {retryLimit: '2', exponentialBackoffBase: '2', exponentialBackoffScale: '0.5'}) => {
        await RetryPolicyConfiguration.setRetry(options);
    }

    setTimeoutInterval = async (timeoutInterval) => {
        await this.timeoutIntervalInput.clearText();
        await this.timeoutIntervalInput.replaceText(timeoutInterval);
    }
}

const apiClientRequestScreen = new ApiClientRequestScreen();
export default apiClientRequestScreen;
