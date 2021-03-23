// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class HeaderListItem {
    testID = {
        addHeadersItemPrefix: "add_headers.header_list_item.",
        listHeadersItemPrefix: "list_headers.header_list_item.",
    };

    getItemAtIndex = (prefix, index) => {
        return {
            keyInput: element(by.id(`${prefix}${index}.key.input`)).atIndex(0),
            valueInput: element(by.id(`${prefix}${index}.value.input`)).atIndex(
                0
            ),
        };
    };

    getAddHeadersItemAtIndex = (index) => {
        return this.getItemAtIndex(this.testID.addHeadersItemPrefix, index);
    };

    getListHeadersItemAtIndex = (index) => {
        return this.getItemAtIndex(this.testID.listHeadersItemPrefix, index);
    };
}

const headerListItem = new HeaderListItem();
export default headerListItem;
