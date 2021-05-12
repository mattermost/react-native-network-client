// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { ScrollView } from "react-native";
import { Button, Divider, Overlay, Text } from "react-native-elements";

type ResponseSuccessOverlayProps = {
    response: ClientResponse | undefined;
    visible: boolean;
    setVisible: (visible: boolean) => void;
};

const ResponseSuccessOverlay = ({
    response,
    visible,
    setVisible,
}: ResponseSuccessOverlayProps) => {
    const hide = () => setVisible(false);

    return (
        <Overlay
            isVisible={visible}
            onBackdropPress={hide}
            overlayStyle={{ marginHorizontal: 20, marginVertical: 40 }}
            testID="response_success_overlay"
        >
            <>
                <Button title="Close" onPress={hide} />
                <Text h4>OK</Text>
                <Text testID="response_success_overlay.success.ok.text">
                    {response?.ok.toString()}
                </Text>
                <Divider />
                <Text h4>Code</Text>
                <Text testID="response_success_overlay.success.code.text">
                    {response?.code}
                </Text>
                <Divider />
                {Boolean(response?.redirectUrls?.length) && (
                    <>
                        <Text h4>Redirect URLs</Text>
                        <Text testID="response_success_overlay.success.redirect_urls.text">
                            {response!.redirectUrls!.join(", ")}
                        </Text>
                        <Divider />
                    </>
                )}
                <Text h4>Retries Exhausted?</Text>
                <Text testID="response_success_overlay.success.retries_exhausted.text">
                    {response?.hasOwnProperty("retriesExhausted")
                        ? response.retriesExhausted!.toString()
                        : "null"}
                </Text>
                <Divider />
                <Text h4>Headers</Text>
                <ScrollView>
                    <Text testID="response_success_overlay.success.headers.text">
                        {JSON.stringify(response?.headers, null, 2)}
                    </Text>
                </ScrollView>
                <Divider />
                <Text h4>Data</Text>
                <ScrollView>
                    <Text testID="response_success_overlay.success.data.text">
                        {JSON.stringify(response?.data, null, 2)}
                    </Text>
                </ScrollView>
            </>
        </Overlay>
    );
};

export default ResponseSuccessOverlay;
