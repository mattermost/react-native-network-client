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
        trustSelfSignedServerCertificate: false,
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
    const toggleTrustSelfSignedServerCertificate = () =>
        setSessionConfiguration({
            ...sessionConfiguration,
            trustSelfSignedServerCertificate: !sessionConfiguration.trustSelfSignedServerCertificate,
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
        toggleTrustSelfSignedServerCertificate,
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
                : Constants.RETRY_TYPES.EXPONENTIAL_BACKOFF,
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

type UseClientP12ConfigurationResponse = [
    ClientP12Configuration,
    (path: string) => void,
    (password?: string) => void
];

export const useClientP12Configuration = (): UseClientP12ConfigurationResponse => {
    const [
        clientP12Configuration,
        setClientP12Configuration,
    ] = useState<ClientP12Configuration>({
        path: "",
        password: "password",
    });

    const setClientP12Path = (path: string) =>
        setClientP12Configuration({
            ...clientP12Configuration,
            path,
        });

    const setClientP12Password = (password?: string) =>
        setClientP12Configuration({
            ...clientP12Configuration,
            password,
        });

    return [clientP12Configuration, setClientP12Path, setClientP12Password];
};
