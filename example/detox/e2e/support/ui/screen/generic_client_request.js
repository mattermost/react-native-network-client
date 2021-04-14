// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    AddHeaders,
    MethodButtons,
    ResponseSuccessOverlay,
    RetryPolicyConfiguration,
} from "@support/ui/component";
import { ClientListScreen } from "@support/ui/screen";
import { isAndroid, waitForAndScrollDown } from "@support/utils";

class GenericClientRequestScreen {
    testID = {
        genericClientRequestScrollView: "generic_client_request.scroll_view",
        bodyInput: "generic_client_request.body.input",
        timeoutIntervalInput: "generic_client_request.timeout_interval.input",
        urlInput: "generic_client_request.url.input",
    };

    genericClientRequestScreen = element(by.text("GenericClientRequest"));
    genericClientRequestScrollView = element(
        by.id(this.testID.genericClientRequestScrollView)
    );
    bodyInput = element(by.id(this.testID.bodyInput));
    timeoutIntervalInput = element(by.id(this.testID.timeoutIntervalInput));
    urlInput = element(by.id(this.testID.urlInput));
    clientListButton = element(by.text("ClientList")).atIndex(0);
    requestButton = element(by.text("Request"));

    // convenience props
    getButton = MethodButtons.getButton;
    deleteButton = MethodButtons.deleteButton;
    patchButton = MethodButtons.patchButton;
    postButton = MethodButtons.postButton;
    putButton = MethodButtons.putButton;
    responseSuccessOverlay = ResponseSuccessOverlay.responseSuccessOverlay;
    responseSuccessCloseButton =
        ResponseSuccessOverlay.responseSuccessCloseButton;
    responseSuccessCodeText = ResponseSuccessOverlay.responseSuccessCodeText;
    responseSuccessDataText = ResponseSuccessOverlay.responseSuccessDataText;
    responseSuccessHeadersText =
        ResponseSuccessOverlay.responseSuccessHeadersText;
    responseSuccessLastRequestedUrlText =
        ResponseSuccessOverlay.responseSuccessLastRequestedUrlText;
    responseSuccessOkText = ResponseSuccessOverlay.responseSuccessOkText;
    responseSuccessRetriesExhaustedText =
        ResponseSuccessOverlay.responseSuccessRetriesExhaustedText;

    retryPolicyConfiguration = new RetryPolicyConfiguration(
        this.testID.genericClientRequestScrollView
    );

    toBeVisible = async () => {
        await expect(this.genericClientRequestScreen).toBeVisible();

        return this.genericClientRequestScreen;
    };

    open = async () => {
        // # Open generic client screen
        await ClientListScreen.genericClientAction.tap();

        return this.toBeVisible();
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.clientListButton.tap();
        }
        await expect(this.genericClientRequestScreen).not.toBeVisible();
    };

    makeRequest = async () => {
        await waitForAndScrollDown(
            this.requestButton,
            this.testID.genericClientRequestScrollView
        );
        await this.requestButton.tap();
    };

    setBody = async (body) => {
        await waitForAndScrollDown(
            this.bodyInput,
            this.testID.genericClientRequestScrollView
        );
        await this.bodyInput.clearText();
        await this.bodyInput.replaceText(body);
        await this.bodyInput.tapReturnKey();
    };

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
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
        await this.retryPolicyConfiguration.setRetry(options);
    };

    setTimeoutInterval = async (timeoutInterval) => {
        await waitForAndScrollDown(
            this.timeoutIntervalInput,
            this.testID.genericClientRequestScrollView
        );
        await this.timeoutIntervalInput.clearText();
        await this.timeoutIntervalInput.replaceText(timeoutInterval);
        await this.timeoutIntervalInput.tapReturnKey();
    };

    setUrl = async (url) => {
        await waitForAndScrollDown(
            this.urlInput,
            this.testID.genericClientRequestScrollView
        );
        await this.urlInput.clearText();
        await this.urlInput.replaceText(url);
        await this.urlInput.tapReturnKey();
    };
}

const genericClientRequestScreen = new GenericClientRequestScreen();
export default genericClientRequestScreen;
