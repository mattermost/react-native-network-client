// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { useState } from "react";

import { Constants } from "@mattermost/react-native-network-client";

type UseSessionConfigurationResponse = [
    SessionConfiguration,
    () => void,
    () => void,
    () => void,
    () => void,
    (timeoutIntervalForRequest: number) => void,
    (timeoutIntervalForResource: number) => void,
    (httpMaximumConnectionsPerHost: number) => void
];

export const useSessionConfiguration = (): UseSessionConfigurationResponse => {
    const [
        sessionConfiguration,
        setSessionConfiguration,
    ] = useState<SessionConfiguration>({
        followRedirects: true,
        allowsCellularAccess: true,
        waitsForConnectivity: false,
        timeoutIntervalForRequest: 30,
        timeoutIntervalForResource: 30,
        httpMaximumConnectionsPerHost: 10,
        cancelRequestsOnUnauthorized: false,
    });

    const toggleFollowRedirects = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            followRedirects: !sessionConfiguration.followRedirects,
        });
    const toggleAllowsCellularAccess = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            allowsCellularAccess: !sessionConfiguration.allowsCellularAccess,
        });
    const toggleWaitsForConnectivity = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            waitsForConnectivity: !sessionConfiguration.waitsForConnectivity,
        });
    const toggleCancelRequestsOnUnauthorized = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            cancelRequestsOnUnauthorized: !sessionConfiguration.cancelRequestsOnUnauthorized,
        });
    const setTimeoutIntervalForRequest = (timeoutIntervalForRequest: number) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            timeoutIntervalForRequest,
        });
    const setTimeoutIntervalForResource = (
        timeoutIntervalForResource: number
    ) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            timeoutIntervalForResource,
        });
    const setHttpMaximumConnectionsPerHost = (
        httpMaximumConnectionsPerHost: number
    ) =>
        setSessionConfiguration({
            ...sessionConfiguration,
            httpMaximumConnectionsPerHost,
        });

    return [
        sessionConfiguration,
        toggleFollowRedirects,
        toggleAllowsCellularAccess,
        toggleWaitsForConnectivity,
        toggleCancelRequestsOnUnauthorized,
        setTimeoutIntervalForRequest,
        setTimeoutIntervalForResource,
        setHttpMaximumConnectionsPerHost,
    ];
};

type UseRetryPolicyConfigurationResponse = [
    RetryPolicyConfiguration,
    () => void,
    (retryLimit: number) => void,
    (exponentialBackoffBase: number) => void,
    (exponentialBackoffScale: number) => void
];

export const useRetryPolicyConfiguration = (): UseRetryPolicyConfigurationResponse => {
    const [
        retryPolicyConfiguration,
        setRetryPolicyConfiguration,
    ] = useState<RetryPolicyConfiguration>({
        type: undefined,
        retryLimit: 2,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 0.5,
    });

    const toggleRetryPolicyType = () =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            type: retryPolicyConfiguration.type
                ? undefined
                : Constants.EXPONENTIAL_RETRY,
        });
    const setRetryLimit = (retryLimit: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            retryLimit,
        });
    const setExponentialBackoffBase = (exponentialBackoffBase: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            exponentialBackoffBase,
        });
    const setExponentialBackoffScale = (exponentialBackoffScale: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            exponentialBackoffScale,
        });

    return [
        retryPolicyConfiguration,
        toggleRetryPolicyType,
        setRetryLimit,
        setExponentialBackoffBase,
        setExponentialBackoffScale,
    ];
};

type UseCertificateConfigurationResponse = [
    CertificateConfiguration,
    (clientCertificate?: string) => void,
    (serverCertificate?: string) => void,
    () => void
];

export const useCertificateConfiguration = (): UseCertificateConfigurationResponse => {
    const [
        certificateConfiguration,
        setCertificateConfiguration,
    ] = useState<CertificateConfiguration>({
        clientCertificatePath: undefined,
        serverCertificatePath: undefined,
        pinServerCertificate: false,
    });

    const setClientCertificatePath = (clientCertificatePath?: string) => {
        setCertificateConfiguration({
            ...certificateConfiguration,
            clientCertificatePath,
        });
    };

    const setServerCertificatePath = (serverCertificatePath?: string) => {
        setCertificateConfiguration({
            ...certificateConfiguration,
            serverCertificatePath,
        });
    };

    const togglePinServerCertificate = () =>
        setCertificateConfiguration({
            ...certificateConfiguration,
            pinServerCertificate: !certificateConfiguration.pinServerCertificate,
        });

    return [
        certificateConfiguration,
        setClientCertificatePath,
        setServerCertificatePath,
        togglePinServerCertificate,
    ];
};
