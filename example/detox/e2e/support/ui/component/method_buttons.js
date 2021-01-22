// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class MethodButtons {
    getButton = element(by.text('GET'));
    deleteButton = element(by.text('DELETE'));
    patchButton = element(by.text('PATCH'));
    postButton = element(by.text('POST'));
    putButton = element(by.text('PUT'));
}

const methodButtons = new MethodButtons();
export default methodButtons;
