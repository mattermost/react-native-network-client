// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { ScrollView } from "react-native";
import { Divider, Overlay, Text } from "react-native-elements";

type ResponseOverlayProps = {
    response: ClientResponse | undefined;
    visible: boolean;
    setVisible: (visible: boolean) => void;
};

const ResponseOverlay = ({
    response,
    visible,
    setVisible,
}: ResponseOverlayProps) => {
    const hide = () => setVisible(false);

    return (
        <Overlay
            isVisible={visible}
            onBackdropPress={hide}
            overlayStyle={{ marginHorizontal: 20, marginVertical: 40 }}
            testID="response_overlay"
        >
            <>
                <Text h4>URL</Text>
                <Text testID="response_overlay.response.last_requested_url.text">
                    {response?.lastRequestedUrl}
                </Text>
                <Divider />
                <Text h4>Code</Text>
                <Text testID="response_overlay.response.code.text">
                    {response?.code}
                </Text>
                <Divider />
                <Text h4>OK</Text>
                <Text testID="response_overlay.response.ok.text">
                    {response?.ok.toString()}
                </Text>
                <Divider />
                <Text h4>Retries Exhausted?</Text>
                <Text testID="response_overlay.response.retries_exhausted.text">
                    {response?.hasOwnProperty("retriesExhausted")
                        ? response.retriesExhausted!.toString()
                        : "null"}
                </Text>
                <Divider />
                <Text h4>Headers</Text>
                <ScrollView>
                    <Text testID="response_overlay.response.headers.text">
                        {JSON.stringify(response?.headers, null, 2)}
                    </Text>
                </ScrollView>
                <Divider />
                <Text h4>Data</Text>
                <ScrollView>
                    <Text testID="response_overlay.response.data.text">
                        {JSON.stringify(response?.data, null, 2)}
                    </Text>
                </ScrollView>
            </>
        </Overlay>
    );
};

export default ResponseOverlay;
