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
        >
            <>
                <Text h4>URL</Text>
                <Text>{response?.lastRequestedUrl}</Text>
                <Divider />
                <Text h4>Code</Text>
                <Text>{response?.code}</Text>
                <Divider />
                <Text h4>Headers</Text>
                <ScrollView>
                    <Text>{JSON.stringify(response?.headers, null, 2)}</Text>
                </ScrollView>
                <Divider />
                <Text h4>Data</Text>
                <ScrollView>
                    <Text>{JSON.stringify(response?.data, null, 2)}</Text>
                </ScrollView>
            </>
        </Overlay>
    );
};

export default ResponseOverlay;
