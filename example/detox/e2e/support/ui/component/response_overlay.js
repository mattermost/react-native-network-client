// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ResponseOverlay {
    testID = {
        responseCodeText: "response_overlay.response.code.text",
        responseDataText: "response_overlay.response.data.text",
        responseHeadersText: "response_overlay.response.headers.text",
        responseLastRequestedUrlText:
            "response_overlay.response.last_requested_url.text",
        responseOkText: "response_overlay.response.ok.text",
        responseRetriesExhaustedText:
            "response_overlay.response.retries_exhausted.text",
    };

    responseCodeText = element(by.id(this.testID.responseCodeText));
    responseDataText = element(by.id(this.testID.responseDataText));
    responseHeadersText = element(by.id(this.testID.responseHeadersText));
    responseLastRequestedUrlText = element(
        by.id(this.testID.responseLastRequestedUrlText)
    );
    responseOkText = element(by.id(this.testID.responseOkText));
    responseRetriesExhaustedText = element(
        by.id(this.testID.responseRetriesExhaustedText)
    );
}

const responseOverlay = new ResponseOverlay();
export default responseOverlay;
