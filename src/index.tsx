// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import GenericClient from "./GenericClient";
import { getOrCreateAPIClient } from "./APIClient";
import { getOrCreateWebSocketClient } from "./WebSocketClient";

export default GenericClient;
export { getOrCreateAPIClient, getOrCreateWebSocketClient };
