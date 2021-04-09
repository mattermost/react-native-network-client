// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { ScrollView } from "react-native";
import { Button, Divider, Overlay, Text } from "react-native-elements";

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
                <Button title="Close" onPress={hide} />
                <Text h2 style={{ alignSelf: "center" }}>
                    Error
                </Text>
                <Text h4>Code</Text>
                <Text testID="response_error_overlay.error.code.text">
                    {error?.code}
                </Text>
                <Divider />
                <Text h4>Message</Text>
                <Text testID="response_error_overlay.error.message.text">
                    {error?.message}
                </Text>
                <Divider />
                <Text h4>Domain</Text>
                <Text testID="response_error_overlay.error.domain.text">
                    {error?.domain}
                </Text>
                <Divider />
                <Text h4>User Info</Text>
                <Text testID="response_error_overlay.error.user_info.text">
                    {JSON.stringify(error?.userInfo)}
                </Text>
                <Divider />
                <Text h4>Native Stack</Text>
                <ScrollView>
                    <Text testID="response_error_overlay.error.native_stack.text">
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
