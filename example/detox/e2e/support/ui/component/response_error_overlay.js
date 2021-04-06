// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ResponseErrorOverlay {
    testID = {
        errorCodeText: "response_error_overlay.error.code.text",
        errorDomainText: "response_error_overlay.error.domain.text",
        errorMessageText: "response_error_overlay.error.message.text",
        errorNativeStackText: "response_error_overlay.error.native_stack.text",
        errorUserInfoText: "response_error_overlay.error.user_info.text",
    };

    errorCodeText = element(by.id(this.testID.errorCodeText));
    errorDomainText = element(by.id(this.testID.errorDomainText));
    errorMessageText = element(by.id(this.testID.errorMessageText));
    errorNativeStackText = element(by.id(this.testID.errorNativeStackText));
    errorUserInfoText = element(by.id(this.testID.errorUserInfoText));
}

const responseErrorOverlay = new ResponseErrorOverlay();
export default responseErrorOverlay;
