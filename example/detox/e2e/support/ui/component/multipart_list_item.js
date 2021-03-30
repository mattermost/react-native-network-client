// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class MultipartListItem {
    testID = {
        addMultipartItemPrefix: "add_multipart.multipart_list_item.",
        listMultipartItemPrefix: "list_multipart.multipart_list_item.",
    };

    getItemAtIndex = (prefix, index) => {
        return {
            keyInput: element(by.id(`${prefix}${index}.key.input`)).atIndex(0),
            valueInput: element(by.id(`${prefix}${index}.value.input`)).atIndex(
                0
            ),
        };
    };

    getAddMultipartItemAtIndex = (index) => {
        return this.getItemAtIndex(this.testID.addMultipartItemPrefix, index);
    };

    getListMultipartItemAtIndex = (index) => {
        return this.getItemAtIndex(this.testID.listMultipartItemPrefix, index);
    };
}

const multipartListItem = new MultipartListItem();
export default multipartListItem;
