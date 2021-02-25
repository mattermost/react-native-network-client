// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { CheckBox } from "react-native-elements";

import CertificateInput from "./CertificateInput";

interface CertificateConfigurationProps extends CertificateConfiguration {
    clientCertificatePath?: string;
    serverCertificatePath?: string;
    pinServerCertificate?: boolean;
    setClientCertificatePath: (certificatePath?: string) => void;
    setServerCertificatePath: (certificatePath?: string) => void;
    togglePinServerCertificate: () => void;
}

const CertificateConfiguration = (props: CertificateConfigurationProps) => (
    <>
        <CertificateInput
            title="Client Certificate"
            certificatePath={props.clientCertificatePath}
            onSelect={props.setClientCertificatePath}
        />
        <CertificateInput
            title="Server Certificate"
            certificatePath={props.serverCertificatePath}
            onSelect={props.setServerCertificatePath}
        />
        {props.serverCertificatePath && (
            <CheckBox
                title="Pin Server Certificate?"
                checked={Boolean(props.pinServerCertificate)}
                onPress={props.togglePinServerCertificate}
                iconType="ionicon"
                checkedIcon="ios-checkmark-circle"
                uncheckedIcon="ios-checkmark-circle"
                iconRight
                textStyle={{ flex: 1 }}
            />
        )}
    </>
);

export default CertificateConfiguration;
