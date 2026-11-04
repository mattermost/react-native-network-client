// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { type EmitterSubscription, NativeEventEmitter } from "react-native";

import NativeApiClient, { ApiClientEvents } from "../APIClient/NativeApiClient";

export type SessionAttributeField = {
    name: string;
    type: string;
    ttl_seconds?: number;
    grace_period_seconds?: number;
};

export type SessionAttributesNetworkChangedEvent = {
    serverUrls: string[];
};

let emitter: NativeEventEmitter | undefined;

/**
 * Listens for device network changes (interface type, SSID, VPN state or IP address).
 * By the time the listener runs, the network attributes of the servers in `serverUrls`
 * are reset, so their next request carries the new values whatever their ttl. Only
 * servers with session attributes enabled are listed, and no network value is sent.
 */
export const addSessionAttributesNetworkChangeListener = (
    listener: (serverUrls: string[]) => void,
): EmitterSubscription => {
    if (!emitter) {
        emitter = new NativeEventEmitter(NativeApiClient);
    }
    return emitter.addListener(
        ApiClientEvents.SESSION_ATTRIBUTES_NETWORK_CHANGED,
        (event: SessionAttributesNetworkChangedEvent) => {
            listener(event.serverUrls);
        },
    );
};

export const setSessionAttributesEnabled = (
    serverUrl: string,
    enabled: boolean,
): void => {
    NativeApiClient.setSessionAttributesEnabled(serverUrl, enabled);
};

export const removeSessionAttributesServer = (serverUrl: string): void => {
    NativeApiClient.removeSessionAttributesServer(serverUrl);
};

export const setSessionAttributesManifest = (
    serverUrl: string,
    manifest: SessionAttributeField[],
): void => {
    NativeApiClient.setSessionAttributesManifest(
        serverUrl,
        JSON.stringify(manifest),
    );
};

export const upsertSessionAttributesField = (
    serverUrl: string,
    field: SessionAttributeField,
): void => {
    NativeApiClient.upsertSessionAttributesField(
        serverUrl,
        JSON.stringify(field),
    );
};

export const removeSessionAttributesField = (
    serverUrl: string,
    name: string,
): void => {
    NativeApiClient.removeSessionAttributesField(serverUrl, name);
};

export const setSessionAttributesStableValues = (
    values: Record<string, string>,
): void => {
    NativeApiClient.setSessionAttributesStableValues(JSON.stringify(values));
};

export const getSessionAttributesHeader = (
    serverUrl: string,
): string | undefined => {
    return NativeApiClient.getSessionAttributesHeader(serverUrl) ?? undefined;
};
