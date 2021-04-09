// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ResponseSuccessOverlay {
    testID = {
        responseSuccessOverlay: "response_success_overlay",
        responseSuccessCodeText: "response_success_overlay.success.code.text",
        responseSuccessDataText: "response_success_overlay.success.data.text",
        responseSuccessHeadersText:
            "response_success_overlay.success.headers.text",
        responseSuccessLastRequestedUrlText:
            "response_success_overlay.success.last_requested_url.text",
        responseSuccessOkText: "response_success_overlay.success.ok.text",
        responseSuccessRetriesExhaustedText:
            "response_success_overlay.success.retries_exhausted.text",
    };

    responseSuccessOverlay = element(by.id(this.testID.responseSuccessOverlay));
    responseSuccessCloseButton = element(by.text("Close"));
    responseSuccessCodeText = element(
        by.id(this.testID.responseSuccessCodeText)
    );
    responseSuccessDataText = element(
        by.id(this.testID.responseSuccessDataText)
    );
    responseSuccessHeadersText = element(
        by.id(this.testID.responseSuccessHeadersText)
    );
    responseSuccessLastRequestedUrlText = element(
        by.id(this.testID.responseSuccessLastRequestedUrlText)
    );
    responseSuccessOkText = element(by.id(this.testID.responseSuccessOkText));
    responseSuccessRetriesExhaustedText = element(
        by.id(this.testID.responseSuccessRetriesExhaustedText)
    );
}

const responseSuccessOverlay = new ResponseSuccessOverlay();
export default responseSuccessOverlay;
