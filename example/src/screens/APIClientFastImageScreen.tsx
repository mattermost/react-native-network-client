// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { Input } from "react-native-elements";
import FastImage from "react-native-fast-image";
import Icon from "react-native-vector-icons/MaterialIcons";

const APIClientFastImageScreen = ({ route }: APIClientFastImageScreenProps) => {
    const { client } = route.params;
    const [imageUrl, setImageUrl] = useState(client.baseUrl);
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
                placeholder="/api/v4/system/ping"
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
            />
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {loading && <ActivityIndicator />}
                {errored && <Icon name="image-not-supported" size={100} />}
                <FastImage
                    source={{ uri: imageUrl }}
                    onLoadStart={onLoadStart}
                    onLoadEnd={onLoadEnd}
                    onLoad={onLoad}
                    onError={onError}
                    resizeMode={FastImage.resizeMode.contain}
                    style={{ height: 500, width: 500 }}
                />
            </View>
        </SafeAreaView>
    );
};

export default APIClientFastImageScreen;
