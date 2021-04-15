// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ResponseErrorOverlay {
    testID = {
        responseErrorOverlay: "response_error_overlay",
        responseErrorCodeText: "response_error_overlay.error.code.text",
        responseErrorDomainText: "response_error_overlay.error.domain.text",
        responseErrorMessageText: "response_error_overlay.error.message.text",
        responseErrorNativeStackText:
            "response_error_overlay.error.native_stack.text",
        responseErrorUserInfoText:
            "response_error_overlay.error.user_info.text",
    };

    responseErrorOverlay = element(by.id(this.testID.responseErrorOverlay));
    responseErrorCloseButton = element(by.text("Close"));
    responseErrorCodeText = element(by.id(this.testID.responseErrorCodeText));
    responseErrorDomainText = element(
        by.id(this.testID.responseErrorDomainText)
    );
    responseErrorMessageText = element(
        by.id(this.testID.responseErrorMessageText)
    );
    responseErrorNativeStackText = element(
        by.id(this.testID.responseErrorNativeStackText)
    );
    responseErrorUserInfoText = element(
        by.id(this.testID.responseErrorUserInfoText)
    );

    close = async () => {
        await this.responseErrorCloseButton.tap();
    };
}

const responseErrorOverlay = new ResponseErrorOverlay();
export default responseErrorOverlay;
