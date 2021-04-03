// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { ProgressiveFileUpload } from "@support/ui/component";
import { isAndroid, waitForAndScrollDown } from "@support/utils";

class ApiClientUploadScreen {
    testID = {
        apiClientUploadScrollView: "api_client_upload.scroll_view",
        endpointInput: "api_client_upload.endpoint.input",
    };

    apiClientUploadScreen = element(by.text("APIClientUpload"));
    apiClientButton = element(by.text("APIClient")).atIndex(0);
    apiClientUploadScrollView = element(
        by.id(this.testID.apiClientUploadScrollView)
    );
    endpointInput = element(by.id(this.testID.endpointInput));
    sendAsMultipartCheckboxFalse = element(
        by.text("Send as Multi-part? [false]")
    );
    sendAsMultipartCheckboxTrue = element(
        by.text("Send as Multi-part? [true]")
    );
    attachImageButton = element(by.text("Attach Image"));
    attachTextButton = element(by.text("Attach Text"));
    cancelUploadButton = element(by.text("Cancel Upload"));
    resetButton = element(by.text("Reset"));
    selectFileButton = element(by.text("Select File"));
    selectImageButton = element(by.text("Select Image"));
    uploadFileButton = element(by.text("Upload File"));

    // convenience props
    fileComponent = ProgressiveFileUpload.fileComponent;
    filename = ProgressiveFileUpload.filename;
    fileUri = ProgressiveFileUpload.fileUri;
    progressBar = ProgressiveFileUpload.progressBar;

    toBeVisible = async () => {
        await expect(this.apiClientUploadScreen).toBeVisible();

        return this.apiClientUploadScreen;
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.apiClientButton.tap();
        }
        await expect(this.apiClientUploadScreen).not.toBeVisible();
    };

    makeUploadRequest = async () => {
        await waitForAndScrollDown(
            this.uploadFileButton,
            this.testID.apiClientUploadScrollView
        );
        await this.uploadFileButton.tap();
    };

    setEndpoint = async (endpoint) => {
        await this.endpointInput.clearText();
        await this.endpointInput.replaceText(endpoint);
        await this.endpointInput.tapReturnKey();
    };

    setMultiparts = async (multiparts) => {
        await AddMultipart.setMultiparts(multiparts);
    };

    toggleOnSendAsMultipartCheckbox = async () => {
        await this.sendAsMultipartCheckboxFalse.tap();
        await expect(this.sendAsMultipartCheckboxTrue).toBeVisible();
    };

    toggleOffSendAsMultipartCheckbox = async () => {
        await this.sendAsMultipartCheckboxTrue.tap();
        await expect(this.sendAsMultipartCheckboxFalse).toBeVisible();
    };
}

const apiClientUploadScreen = new ApiClientUploadScreen();
export default apiClientUploadScreen;
