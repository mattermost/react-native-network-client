// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ProgressiveFileUpload} from '@support/ui/component';

class ApiClientUploadScreen {
    testID = {
        endpointInput: 'api_client_upload.endpoint.input',
    }

    apiClientUploadScreen = element(by.text('APIClientUpload'));
    endpointInput = element(by.id(this.testID.endpointInput));
    attachImageButton = element(by.text('Attach Image'));
    attachTextButton = element(by.text('Attach Text'));
    cancelUploadButton = element(by.text('Cancel Upload'));
    resetButton = element(by.text('Reset'));
    selectFileButton = element(by.text('Select File'));
    selectImageButton = element(by.text('Select Image'));
    uploadFileButton = element(by.text('Upload File'));

    // convenience props
    fileComponent = ProgressiveFileUpload.fileComponent;
    filename = ProgressiveFileUpload.filename;
    fileUri = ProgressiveFileUpload.fileUri;
    progressBar = ProgressiveFileUpload.progressBar;

    toBeVisible = async () => {
        await expect(this.apiClientUploadScreen).toBeVisible();

        return this.apiClientUploadScreen;
    }

    back = async () => {
        await this.apiClientButton.tap();
        await expect(this.apiClientUploadScreen).not.toBeVisible();
    }

    setEndpoint = async (endpoint) => {
        await this.endpointInput.clearText();
        await this.endpointInput.replaceText(endpoint);
        await this.endpointInput.tapReturnKey();
    }
}

const apiClientUploadScreen = new ApiClientUploadScreen();
export default apiClientUploadScreen;
