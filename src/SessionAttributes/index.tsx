// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NativeApiClient from "../APIClient/NativeApiClient";

export type SessionAttributeField = {
    name: string;
    type: string;
    ttl_seconds?: number;
    grace_period_seconds?: number;
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
