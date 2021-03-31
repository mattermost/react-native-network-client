// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Alert, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import RFNS, { StatResult } from "react-native-fs";
import { sampleImageContent } from "./files/SampleImage";
import { sampleTextContent } from "./files/SampleText";

import GenericClient, {
    Constants,
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

const buildDefaultApiClientConfiguration = (
    headers: Record<string, string> = {},
    requestAdapterConfiguration: RequestAdapterConfiguration = {
        bearerAuthTokenResponseHeader: "token",
    }
): APIClientConfiguration => {
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
        type: Constants.RETRY_TYPES.EXPONENTIAL_RETRY,
        retryLimit: 2,
        retryInterval: 2000,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 0.5,
    };

    const configuration: APIClientConfiguration = {
        headers,
        sessionConfiguration,
        retryPolicyConfiguration,
        requestAdapterConfiguration,
    };

    return configuration;
};

const createAPIClient = async (
    name: string,
    baseUrl: string,
    configuration: APIClientConfiguration,
    isMattermostClient: boolean = false
): Promise<APIClientItem | null> => {
    const clientErrorEventHandler = (event: APIClientErrorEvent) => {
        Alert.alert(
            `Error for ${baseUrl}`,
            `Code: ${event.errorCode}\nDescription: ${event.errorDescription}`,
            [{ text: "OK" }],
            { cancelable: false }
        );
    };

    try {
        const { client, created } = await getOrCreateAPIClient(
            baseUrl,
            configuration,
            clientErrorEventHandler
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
            isMattermostClient,
        };
    } catch (e) {
        console.log(e.message);
        return null;
    }
};

const createMattermostAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "Mattermost API";
    const baseUrl = "http://192.168.0.14:8065";
    const userAgent = await DeviceInfo.getUserAgent();
    const headers = {
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": userAgent,
    };
    const configuration = buildDefaultApiClientConfiguration(headers);
    const isMattermostClient = true;

    return createAPIClient(name, baseUrl, configuration, isMattermostClient);
};

const createJSONPlaceholderAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "JSON Placeholder API";
    const baseUrl = "https://jsonplaceholder.typicode.com";
    const configuration = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    return createAPIClient(name, baseUrl, configuration);
};

const createFastImageServerAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "Fast Image Server API";
    const baseUrl =
        Platform.OS === "ios"
            ? "http://127.0.0.1:8009"
            : "http://10.0.2.2:8009";
    const headers = {
        Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTYxNTI0MDUwNn0.-FLR4NUPTuBGLXd082MvNmJemoqfLqQi8-sJhCCaNf0",
    };
    const configuration = buildDefaultApiClientConfiguration(headers);

    return createAPIClient(name, baseUrl, configuration);
};

const createFileUploadServerAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "File Upload Server API";
    const baseUrl =
        Platform.OS === "ios"
            ? "http://127.0.0.1:8008"
            : "http://10.0.2.2:8008";
    const configuration = buildDefaultApiClientConfiguration();

    return createAPIClient(name, baseUrl, configuration);
};

const createMockserverAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "Mockserver API";
    const baseUrl =
        Platform.OS === "ios"
            ? "http://127.0.0.1:8080"
            : "http://10.0.2.2:8080";
    const headers = {
        "header-1-key": "header-1-value",
        "header-2-key": "header-2-value",
    };
    const configuration = buildDefaultApiClientConfiguration(headers);

    return createAPIClient(name, baseUrl, configuration);
};

const createRequestBinAPIClient = async (): Promise<APIClientItem | null> => {
    const name = "RequestBin API";
    const baseUrl =
        Platform.OS === "ios"
            ? "http://127.0.0.1:8000/"
            : "http://10.0.2.2:8000/";
    const headers = {
        "header-1-key": "header-1-value",
        "header-2-key": "header-2-value",
    };
    const configuration = buildDefaultApiClientConfiguration(headers);

    return createAPIClient(name, baseUrl, configuration);
};

const createWebSocketClient = async (
    name: string,
    url: string,
    configuration: WebSocketClientConfiguration,
    isMattermostClient: boolean = false
): Promise<WebSocketClientItem | null> => {
    const clientErrorEventHandler = (event: WebSocketClientErrorEvent) => {
        Alert.alert(
            `Error for ${url}`,
            `Code: ${event.errorCode}\nDescription: ${event.errorDescription}`,
            [{ text: "OK" }],
            { cancelable: false }
        );
    };

    try {
        const { client, created } = await getOrCreateWebSocketClient(
            url,
            configuration,
            clientErrorEventHandler
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
            isMattermostClient,
        };
    } catch (e) {
        console.log(e.message);
        return null;
    }
};

const createMattermostWebSocketClient = async (): Promise<WebSocketClientItem | null> => {
    const name = "Mattermost WebSocket";
    const host = Platform.OS === "ios" ? "192.168.0.14:8065" : "10.0.2.2:8065";
    const url = `ws://${host}/api/v4/websocket`;
    const origin = `https://${host}`;
    const configuration: WebSocketClientConfiguration = {
        headers: {
            host,
            origin,
        },
    };
    const isMattermostClient = true;

    return createWebSocketClient(name, url, configuration, isMattermostClient);
};

const createSimpleWebSocketClient = async (): Promise<WebSocketClientItem | null> => {
    const name = "Simple WebSocket";
    const host = Platform.OS === "ios" ? "127.0.0.1:3000" : "10.0.2.2:3000";
    const url = `ws://${host}/api/websocket`;
    const origin = `http://${host}`;
    const configuration: WebSocketClientConfiguration = {
        headers: {
            host,
            origin,
        },
    };

    return createWebSocketClient(name, url, configuration);
};

export const createTestClients = async (): Promise<NetworkClientItem[]> => {
    return [
        { name: "Generic", client: GenericClient, type: ClientType.GENERIC },
        await createMattermostAPIClient(),
        await createJSONPlaceholderAPIClient(),
        await createFastImageServerAPIClient(),
        await createFileUploadServerAPIClient(),
        await createMockserverAPIClient(),
        await createRequestBinAPIClient(),
        await createMattermostWebSocketClient(),
        await createSimpleWebSocketClient(),
    ].reduce((clients: NetworkClientItem[], client) => {
        if (client) {
            return [...clients, client];
        }

        return clients;
    }, []);
};

export const createNativeFile = async (
    fileContent: FileContent
): Promise<File> => {
    const path = RFNS.DocumentDirectoryPath + `/${fileContent.name}`;
    await RFNS.writeFile(path, fileContent.content, fileContent.encoding);
    const statResult: StatResult = await RFNS.stat(path);

    return {
        name: fileContent.name,
        size: Number(statResult.size),
        type: fileContent.type,
        uri: `file://${statResult.path}`,
    };
};

const buildFileContent = (
    filename: string,
    content: string,
    encoding: BufferEncoding,
    type: string
): FileContent => {
    return {
        name: filename,
        content,
        encoding,
        type,
    };
};

export const sampleImage: FileContent = buildFileContent(
    "sample-image.jpg",
    sampleImageContent,
    "base64",
    "image"
);
export const sampleText: FileContent = buildFileContent(
    "sample-text.txt",
    sampleTextContent,
    "ascii",
    "text"
);

export const ClientContext = React.createContext({
    clients: [] as NetworkClientItem[],
    setClients: (() => {}) as React.Dispatch<
        React.SetStateAction<NetworkClientItem[]>
    >,
});

export const apiClientErrorEventHandler: APIClientErrorEventHandler = (
    event: APIClientErrorEvent
) => {
    Alert.alert(
        "Error",
        `Server: ${event.serverUrl}\nCode: ${event.errorCode}\nDesc: ${event.errorDescription}`
    );
};

export const webSocketClientErrorEventHandler: WebSocketClientErrorEventHandler = (
    event: WebSocketClientErrorEvent
) => {
    Alert.alert(
        "Error",
        `Server: ${event.url}\nCode: ${event.errorCode}\nDesc: ${event.errorDescription}`
    );
};
