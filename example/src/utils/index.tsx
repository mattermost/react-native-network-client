// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Alert } from "react-native";
import DeviceInfo from "react-native-device-info";

import GenericClient, {
    getOrCreateAPIClient,
    getOrCreateWebSocketClient,
} from "@mattermost/react-native-network-client";

export enum METHODS {
    GET = "GET",
    PUT = "PUT",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
}

export enum UploadStatus {
    UPLOADING = "UPLOADING",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED",
    POST_FAILED = "POST_FAILED",
}

export enum ClientType {
    GENERIC,
    API,
    WEBSOCKET,
}

export const parseHeaders = (headers: Header[]): ClientHeaders => {
    return headers
        .filter(({ key, value }) => key && value)
        .reduce((prev, cur) => ({ ...prev, [cur.key]: cur.value }), {} as any);
};

export const networkClientKeyExtractor = (item: NetworkClientItem) => {
    if ("baseUrl" in item.client) {
        return item.client.baseUrl;
    } else if ("url" in item.client) {
        return item.client.url;
    }

    return item.name;
};

const createJSONPlaceholderAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "JSON Placeholder";
    const baseUrl = "https://jsonplaceholder.typicode.com";
    const options = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const { client, created } = await getOrCreateAPIClient(baseUrl, options);

    if (!created) {
        Alert.alert(
            "Error",
            `A client for ${baseUrl} already exists`,
            [{ text: "OK" }],
            { cancelable: false }
        );

        return null;
    }

    return {
        name,
        client,
        type: ClientType.API,
    };
};

const createMattermostAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "Mattermost";
    const baseUrl = "http://192.168.0.14:8065";
    const userAgent = await DeviceInfo.getUserAgent();
    const headers = {
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": userAgent,
    };
    const sessionConfiguration = {
        followRedirects: true,
        allowsCellularAccess: true,
        waitsForConnectivity: false,
        timeoutIntervalForRequest: 30,
        timeoutIntervalForResource: 30,
        httpMaximumConnectionsPerHost: 10,
        cancelRequestsOnUnauthorized: true,
    };
    const retryPolicyConfiguration = {
        type: undefined,
        retryLimit: 2,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 0.5,
    };
    const requestAdapterConfiguration = {
        bearerAuthTokenResponseHeader: "token",
    };

    const options: APIClientConfiguration = {
        headers,
        sessionConfiguration,
        retryPolicyConfiguration,
        requestAdapterConfiguration,
    };

    try {
        const { client, created } = await getOrCreateAPIClient(
            baseUrl,
            options
        );
        if (!created) {
            Alert.alert(
                "Error",
                `A client for ${baseUrl} already exists`,
                [{ text: "OK" }],
                { cancelable: false }
            );

            return null;
        }

        return {
            name,
            client,
            type: ClientType.API,
            isMattermostClient: true,
        };
    } catch (e) {
        console.log(JSON.stringify(e));
        return null;
    }
};

export const createMattermostWebSocketClient = async (): Promise<WebSocketClientItem | null> => {
    const name = "Mattermost";
    const host = "ws://192.168.0.14:8065";
    const url = `${host}/api/v4/websocket`;
    const configuration: WebSocketClientConfiguration = {
        headers: {
            origin: host,
        },
    };

    const { client, created } = await getOrCreateWebSocketClient(
        url,
        configuration
    );

    if (!created) {
        Alert.alert(
            "Error",
            `A client for ${url} already exists`,
            [{ text: "OK" }],
            { cancelable: false }
        );

        return null;
    }

    return {
        name,
        client,
        type: ClientType.WEBSOCKET,
        isMattermostClient: true,
    };
};

export const createTestClients = async (): Promise<NetworkClientItem[]> => {
    return [
        { name: "Generic", client: GenericClient, type: ClientType.GENERIC },
        await createMattermostAPIClient(),
        await createJSONPlaceholderAPIClient(),
        await createMattermostWebSocketClient(),
    ].reduce((clients: NetworkClientItem[], client) => {
        if (client) {
            return [...clients, client];
        }

        return clients;
    }, []);
};

export const ClientContext = React.createContext({
    clients: [] as NetworkClientItem[],
    setClients: (() => {}) as React.Dispatch<
        React.SetStateAction<NetworkClientItem[]>
    >,
});
