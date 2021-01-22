// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { ADD_CLIENT, UPDATE_CLIENT, REMOVE_CLIENT } from "./types";

export function addClient(client: NetworkClient) {
    return {
        type: ADD_CLIENT,
        client,
    };
}

export function updateClient(client: NetworkClient) {
    return {
        type: UPDATE_CLIENT,
        client,
    };
}

export function removeClient(client: NetworkClient) {
    return {
        type: REMOVE_CLIENT,
        client,
    };
}
