// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    GenericClient,
    getOrCreateApiClient,
    removeApiClient,
} from './ApiClient';
import {
    getOrCreateWebSocketClient,
    removeWebSocketClient,
} from './WebSocketClient';

export default new GenericClient();
export {
    getOrCreateApiClient,
    removeApiClient,
    getOrCreateWebSocketClient,
    removeWebSocketClient,
};
