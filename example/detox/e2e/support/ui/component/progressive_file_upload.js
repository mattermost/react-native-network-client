// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ProgressiveFileUpload {
    testID = {
        fileComponent: 'progress_file_upload.file_component',
        filename: 'progress_file_upload.filename',
        fileUri: 'progress_file_upload.file_uri',
        progressBar: 'progress_file_upload.progress_bar',
    }

    fileComponent = element(by.id(this.testID.fileComponent));
    filename = element(by.id(this.testID.filename));
    fileUri = element(by.id(this.testID.fileUri));
    progressBar = element(by.id(this.testID.progressBar));
}

const progressiveFileUpload = new ProgressiveFileUpload();
export default progressiveFileUpload;
