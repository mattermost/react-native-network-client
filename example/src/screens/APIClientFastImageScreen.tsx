// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { useRoute } from "@react-navigation/core";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { Button, Input } from "react-native-elements";
import { Image, type ImageLoadEventData } from 'expo-image';
import Icon from "react-native-vector-icons/MaterialIcons";

const APIClientFastImageScreen = () => {
    const route = useRoute<APIClientFastImageScreenProps['route']>();
    const {
        item: { client },
    } = route.params;
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [errored, setErrored] = useState(false);
    const imgRef = useRef<Image>(null);
    const [isAnimated, setIsAnimated] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const toggleAnimation = useCallback(() => {
        if (isPlaying) {
            imgRef.current?.stopAnimating();
        } else {
            imgRef.current?.startAnimating();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const onLoadStart = () => setLoading(true);
    const onLoadEnd = () => setLoading(false);
    const onLoad = (e: ImageLoadEventData) => {
        setIsAnimated(e.source.isAnimated || false);
        setErrored(false);
        setLoading(false);
    }
    const onError = () => {
        setErrored(true);
        setLoading(false);
    }

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
                {errored && (
                    <Icon
                        name="image"
                        size={100}
                        testID="api_client_fast_image.image_not_supported.icon"
                    />
                )}
                {isAnimated && (
                    <Button
                        onPress={toggleAnimation}
                        title={isPlaying ? 'Stop Animation' : 'Animate'}
                    />
                )}
                <View style={{ flex: 1 }}>
                    <Image
                        ref={imgRef}
                        autoplay={false}
                        enableLiveTextInteraction={true}
                        source={{ uri: imageUrl }}
                        onLoadStart={onLoadStart}
                        onLoadEnd={onLoadEnd}
                        onLoad={onLoad}
                        onError={onError}
                        contentFit='contain'
                        style={{ height: 400, width: 400 }}
                        testID="api_client_fast_image.fast_image"
                        transition={{duration: 500}}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default APIClientFastImageScreen;
