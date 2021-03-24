// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class ClientListItem {
    testID = {
        item: "client_list_item.item",
        chevron: "client_list_item.chevron",
        content: "client_list_item.content",
        subtitle: "client_list_item.subtitle",
        title: "client_list_item.title",
    };

    getItemByName = (name) => {
        const itemMatcher = by
            .id(this.testID.item)
            .withDescendant(by.text(name));

        return {
            item: element(itemMatcher),
            chevron: element(
                by.id(this.testID.chevron).withAncestor(itemMatcher)
            ),
            content: element(
                by.id(this.testID.content).withAncestor(itemMatcher)
            ),
            subtitle: element(
                by.id(this.testID.subtitle).withAncestor(itemMatcher)
            ),
            title: element(by.id(this.testID.title).withAncestor(itemMatcher)),
        };
    };
}

const clientListItem = new ClientListItem();
export default clientListItem;
