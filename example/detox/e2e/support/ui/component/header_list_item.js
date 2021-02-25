// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class HeaderListItem {
    getItemAtIndex = (index) => {
        return {
            keyInput: element(by.id(`header_list_item.${index}.key.input`)).atIndex(0),
            valueInput: element(by.id(`header_list_item.${index}.value.input`)).atIndex(0),
        }
    }
}

const headerListItem = new HeaderListItem();
export default headerListItem;
