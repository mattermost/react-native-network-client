// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ResponseOverlay {
    testID = {
        responseLastRequestedUrlText: 'response_overlay.response.last_requested_url.text',
        responseCodeText: 'response_overlay.response.code.text',
        responseDataText: 'response_overlay.response.data.text',
        responseHeadersText: 'response_overlay.response.headers.text',
    }
    responseLastRequestedUrlText = element(by.id(this.testID.responseLastRequestedUrlText));
    responseCodeText = element(by.id(this.testID.responseCodeText));
    responseDataText = element(by.id(this.testID.responseDataText));
    responseHeadersText = element(by.id(this.testID.responseHeadersText));
}

const responseOverlay = new ResponseOverlay();
export default responseOverlay;
