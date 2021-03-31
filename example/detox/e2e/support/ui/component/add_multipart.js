// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import MultipartListItem from "./multipart_list_item";
import { isAndroid } from "@support/utils";

class AddMultipart {
    testID = {
        addEmptyMultipartButton: "add_empty_multipart.button",
    };

    addEmptyMultipartButton = element(
        by.id(this.testID.addEmptyMultipartButton)
    );

    getMultipartListItemAtIndex = (index) => {
        return MultipartListItem.getAddMultipartItemAtIndex(index);
    };

    setMultipart = async (index, key, value) => {
        const { keyInput, valueInput } = this.getMultipartListItemAtIndex(
            index
        );

        // # Set multipart key
        await keyInput.clearText();
        await keyInput.replaceText(key);
        await keyInput.tapReturnKey();

        // # Set multipart value
        await valueInput.clearText();
        await valueInput.replaceText(value);
        await valueInput.tapReturnKey();

        // * Verify input values
        if (isAndroid()) {
            await expect(keyInput).toHaveText(key);
            await expect(valueInput).toHaveText(value);
        } else {
            await expect(keyInput).toHaveValue(key);
            await expect(valueInput).toHaveValue(value);
        }
    };

    setMultiparts = async (multiparts) => {
        const entries = Object.entries(multiparts);
        for (const [index, [key, value]] of Object.entries(entries)) {
            await this.setMultipart(index, key, value);
            if (index < entries.length - 1) {
                await this.addEmptyMultipartButton.tap();
            }
        }
    };
}

const addMultipart = new AddMultipart();
export default addMultipart;
