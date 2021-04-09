// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { isAndroid } from "@support/utils";

class ApiClientFastImageScreen {
    testID = {
        imageUrlInput: "api_client_fast_image.image_url.input",
        fastImage: "api_client_fast_image.fast_image",
        imageNotSupportedIcon: "api_client_fast_image.image_not_supported.icon",
    };

    apiClientFastImageScreen = element(by.text("APIClientFastImage"));
    apiClientButton = element(by.text("APIClient")).atIndex(0);
    imageUrlInput = element(by.id(this.testID.imageUrlInput));
    fastImage = element(by.id(this.testID.fastImage));
    imageNotSupportedIcon = element(by.id(this.testID.imageNotSupportedIcon));

    toBeVisible = async () => {
        await expect(this.apiClientFastImageScreen).toBeVisible();

        return this.apiClientFastImageScreen;
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.apiClientButton.tap();
        }
        await expect(this.apiClientFastImageScreen).not.toBeVisible();
    };

    setImageUrl = async (imageUrl) => {
        await this.imageUrlInput.clearText();
        await this.imageUrlInput.replaceText(imageUrl);
        await this.imageUrlInput.tapReturnKey();
    };
}

const apiClientFastImageScreen = new ApiClientFastImageScreen();
export default apiClientFastImageScreen;
