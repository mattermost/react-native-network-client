// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { useState } from "react";

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
    (type?: keyof Constants) => void,
    (retryLimit: number) => void,
    (retryInterval: number) => void,
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
        retryInterval: 2000,
        exponentialBackoffBase: 2,
        exponentialBackoffScale: 0.5,
    });

    const setRetryPolicyType = (type?: keyof Constants) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            type: type || undefined,
        });
    const setRetryLimit = (retryLimit: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            retryLimit,
        });
    const setRetryInterval = (retryInterval: number) =>
        setRetryPolicyConfiguration({
            ...retryPolicyConfiguration,
            retryInterval,
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
        setRetryPolicyType,
        setRetryLimit,
        setRetryInterval,
        setExponentialBackoffBase,
        setExponentialBackoffScale,
    ];
};
