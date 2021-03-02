// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { Input } from "react-native-elements";
import FastImage from "react-native-fast-image";
import Icon from "react-native-vector-icons/MaterialIcons";

const APIClientFastImageScreen = ({ route }: APIClientFastImageScreenProps) => {
    const {
        item: { client },
    } = route.params;
    const [imageUrl, setImageUrl] = useState(
        `${client.baseUrl}/api/v4/files/xjiid3qaa38kjxxwr9mxbfxyco`
    );
    const [loading, setLoading] = useState(false);
    const [errored, setErrored] = useState(false);

    const onLoadStart = () => setLoading(true);
    const onLoadEnd = () => setLoading(false);
    const onLoad = () => setErrored(false);
    const onError = () => setErrored(true);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Input
                label="Image URL"
                placeholder={`${client.baseUrl}/image.png`}
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
                testID="api_client_fast_image.image_url.input"
            />
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {loading && <ActivityIndicator />}
                {errored && <Icon name="image-not-supported" size={100} testID="api_client_fast_image.image_not_supported.icon"/>}
                <FastImage
                    source={{ uri: imageUrl }}
                    onLoadStart={onLoadStart}
                    onLoadEnd={onLoadEnd}
                    onLoad={onLoad}
                    onError={onError}
                    resizeMode={FastImage.resizeMode.contain}
                    style={{ height: 400, width: 400 }}
                    testID="api_client_fast_image.fast_image"
                />
            </View>
        </SafeAreaView>
    );
};

export default APIClientFastImageScreen;
