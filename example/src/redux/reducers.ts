// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { ADD_CLIENT, UPDATE_CLIENT, REMOVE_CLIENT } from "./types";

type ClientAction = {
    type: string;
    client: NetworkClient;
};

export function clients(state: NetworkClient[] = [], action: ClientAction) {
    switch (action.type) {
        case ADD_CLIENT:
            return [...state, action.client];
        case UPDATE_CLIENT:
            const newState = state.map((client) => {
                if (client.baseUrl === action.client.baseUrl) {
                    return action.client;
                }

                return client;
            });
            return newState;
        case REMOVE_CLIENT:
            const newState = state.filter(
                (client) => client.baseUrl !== action.client.baseUrl
            );
            return newState;
        default:
            return state;
    }
}
