// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isAndroid} from '@support/utils';

class Alert {
    // alert titles
    removeClientTitle = isAndroid() ? element(by.text('Remove Client')) : element(by.label('Remove Client')).atIndex(0);

    // alert buttons
    cancelButton = isAndroid() ? element(by.text('CANCEL')) : element(by.label('Cancel')).atIndex(0);
    okButton = isAndroid() ? element(by.text('OK')) : element(by.label('OK')).atIndex(0);
}

const alert = new Alert();
export default alert;
