// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import HeaderListItem from './header_list_item';

class AddHeaders {
    testID = {
        addEmptyHeaderButton: 'add_empty_header.button',
    }

    addEmptyHeaderButton = element(by.id(this.testID.addEmptyHeaderButton));

    getHeaderListItemAtIndex = (index) => {
        return HeaderListItem.getItemAtIndex(index);
    }

    setHeader = async (index, key, value) => {
        const {keyInput, valueInput} = this.getHeaderListItemAtIndex(index);

        // # Set header key
        await keyInput.clearText();
        await keyInput.replaceText(key);
        await keyInput.tapReturnKey();
        await expect(keyInput).toHaveValue(key);

        // # Set header value
        await valueInput.clearText();
        await valueInput.replaceText(value);
        await valueInput.tapReturnKey();
        await expect(valueInput).toHaveValue(value);
    }

    setHeaders = async (headers) => {
        const entries = Object.entries(headers);
        for (const [index, [key, value]] of Object.entries(entries)) {
            await this.setHeader(index, key, value);
            if (index < entries.length - 1) {
                await this.addEmptyHeaderButton.tap();
            }
        }
    }
}

const adHeaders = new AddHeaders();
export default adHeaders;
