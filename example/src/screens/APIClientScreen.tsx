// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView } from "react-native";
import { Input, Button } from "react-native-elements";

import ListHeaders from "../components/ListHeaders";
import { METHODS } from "../utils";

import type { ClientHeaders } from "@mattermost/react-native-network-client";

export default function APIClientScreen({
    navigation,
    route,
}: APIClientScreenProps) {
    const { item } = route.params;
    const { client, name } = item;

    const [headers, setHeaders] = useState<Header[]>([]);

    const getRequest = () =>
        navigation.navigate("APIClientRequest", {
            item,
            method: METHODS.GET,
        });
    const putRequest = () =>
        navigation.navigate("APIClientRequest", {
            item,
            method: METHODS.PUT,
        });
    const postRequest = () =>
        navigation.navigate("APIClientRequest", {
            item,
            method: METHODS.POST,
        });
    const patchRequest = () =>
        navigation.navigate("APIClientRequest", {
            item,
            method: METHODS.PATCH,
        });
    const deleteRequest = () =>
        navigation.navigate("APIClientRequest", {
            item,
            method: METHODS.DELETE,
        });
    const uploadRequest = () =>
        navigation.navigate("APIClientUpload", { item });
    const downloadRequest = () =>
        navigation.navigate("APIClientDownload", { item });
    const mattermostUploadRequest = () =>
        navigation.navigate("MattermostClientUpload", { item });
    const fastImageRequest = () =>
        navigation.navigate("APIClientFastImage", { item });
    const importP12 = () => navigation.navigate("APIClientImportP12", { item });

    const Buttons = () => {
        const buttons = [
            { title: METHODS.GET, onPress: getRequest },
            { title: METHODS.PUT, onPress: putRequest },
            { title: METHODS.POST, onPress: postRequest },
            { title: METHODS.PATCH, onPress: patchRequest },
            { title: METHODS.DELETE, onPress: deleteRequest },
            { title: "UPLOAD", onPress: uploadRequest },
            { title: "DOWNLOAD", onPress: downloadRequest },
            { title: "FAST IMAGE", onPress: fastImageRequest },
            { title: "IMPORT P12", onPress: importP12 },
        ];
        if (item.isMattermostClient) {
            buttons.push({
                title: "MATTERMOST UPLOAD",
                onPress: mattermostUploadRequest,
            });
        }

        return (
            <>
                {buttons.map(({ title, onPress }) => (
                    <Button
                        key={`button-${title}`}
                        title={title}
                        onPress={onPress}
                        containerStyle={{ margin: 5 }}
                    />
                ))}
            </>
        );
    };

    useEffect(() => {
        client.getHeaders().then((clientHeaders: ClientHeaders) => {
            const ordered = Object.keys(clientHeaders)
                .sort()
                .reduce((result: Record<string, string>, key) => {
                    result[key] = clientHeaders[key];
                    return result;
                }, {});
            const orderedHeaders = Object.entries(
                ordered
            ).map(([key, value]) => ({ key, value }));
            setHeaders(orderedHeaders);
        });
    }, []);

    return (
        <SafeAreaView>
            <ScrollView testID="api_client.scroll_view">
                <Input
                    label="Name"
                    value={name}
                    disabled={true}
                    testID="api_client.name.input"
                />
                <Input
                    label="Base URL"
                    value={client.baseUrl}
                    disabled={true}
                    testID="api_client.base_url.input"
                />
                <ListHeaders headers={headers} />
                <Buttons />
            </ScrollView>
        </SafeAreaView>
    );
}
