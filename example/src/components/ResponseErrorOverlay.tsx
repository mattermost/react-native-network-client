// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { ScrollView } from "react-native";
import { Divider, Overlay, Text } from "react-native-elements";

type ResponseErrorOverlayProps = {
    error?: ClientResponseError;
    visible: boolean;
    setVisible: (visible: boolean) => void;
};

const ResponseErrorOverlay = ({
    error,
    visible,
    setVisible,
}: ResponseErrorOverlayProps) => {
    const hide = () => setVisible(false);

    return (
        <Overlay
            isVisible={visible}
            onBackdropPress={hide}
            overlayStyle={{ marginHorizontal: 20, marginVertical: 40 }}
            testID="response_error_overlay"
        >
            <>
                <Text h2 style={{ alignSelf: "center" }}>
                    Error
                </Text>
                <Text h4>Code</Text>
                <Text testID="response_error_overlay.error.code">
                    {error?.code}
                </Text>
                <Divider />
                <Text h4>Message</Text>
                <Text testID="response_error_overlay.error.message">
                    {error?.message}
                </Text>
                <Divider />
                <Text h4>Domain</Text>
                <Text testID="response_error_overlay.error.domain">
                    {error?.domain}
                </Text>
                <Divider />
                <Text h4>User Info</Text>
                <Text testID="response_error_overlay.error.userInfo">
                    {JSON.stringify(error?.userInfo)}
                </Text>
                <Divider />
                <Text h4>Native Stack</Text>
                <ScrollView>
                    <Text testID="response_error_overlay.error.nativeStack">
                        {JSON.stringify(
                            error?.nativeStackAndroid || error?.nativeStackIOS
                        )}
                    </Text>
                </ScrollView>
            </>
        </Overlay>
    );
};

export default ResponseErrorOverlay;
