// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ResponseSuccessOverlay {
    testID = {
        responseLastRequestedUrlText:
            "response_success_overlay.response.last_requested_url.text",
        responseCodeText: "response_success_overlay.response.code.text",
        responseDataText: "response_success_overlay.response.data.text",
        responseHeadersText: "response_success_overlay.response.headers.text",
    };

    responseLastRequestedUrlText = element(
        by.id(this.testID.responseLastRequestedUrlText)
    );
    responseCodeText = element(by.id(this.testID.responseCodeText));
    responseDataText = element(by.id(this.testID.responseDataText));
    responseHeadersText = element(by.id(this.testID.responseHeadersText));
}

const responseSuccessOverlay = new ResponseSuccessOverlay();
export default responseSuccessOverlay;
