// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";
import * as z from "zod";

const { APIClient: NativeAPIClient } = NativeModules;
const { RETRY_TYPES } = NativeAPIClient.getConstants();

const SessionConfigurationSchema = z.object({
    followRedirects: z.boolean().optional(),
    allowsCellularAccess: z.boolean().optional(),
    waitsForConnectivity: z.boolean().optional(),
    timeoutIntervalForRequest: z.number().optional(),
    timeoutIntervalForResource: z.number().optional(),
    httpMaximumConnectionsPerHost: z.number().optional(),
    cancelRequestsOnUnauthorized: z.boolean().optional(),
    trustSelfSignedServerCertificate: z.boolean().optional(),
});

const RetryPolicyConfigurationSchema = z.object({
    type: z.enum(Object.values(RETRY_TYPES) as [RetryTypes]).optional(),
    retryLimit: z.number().optional(),
    retryInterval: z.number().optional(),
    exponentialBackoffBase: z.number().optional(),
    exponentialBackoffScale: z.number().optional(),
    retryMethods: z.array(z.string()),
    statusCodes: z.array(z.number()),
});

const RequestAdapterConfigurationSchema = z.object({
    bearerAuthTokenResponseHeader: z.string().optional(),
});

const ClientP12ConfigurationSchema = z.object({
    path: z.string(),
    password: z.string().optional(),
});

const APIClientConfigurationSchema = z.object({
    headers: z.record(z.string()).optional(),
    sessionConfiguration: SessionConfigurationSchema.optional(),
    retryPolicyConfiguration: RetryPolicyConfigurationSchema.optional(),
    requestAdapterConfiguration: RequestAdapterConfigurationSchema.optional(),
    serverTrustManagerConfig: z.record(z.string()).optional(),
    cachedResponseHandlerConfig: z.record(z.string()).optional(),
    clientP12Configuration: ClientP12ConfigurationSchema.optional(),
});

const RequestOptionsSchema = z.object({
    headers: z.record(z.string()).optional(),
    body: z.union([z.record(z.unknown()), z.string()]).optional(),
    timeoutInterval: z.number().optional(),
    retryPolicyConfiguration: RetryPolicyConfigurationSchema.optional(),
});

const MultipartUploadConfigSchema = z.object({
    fileKey: z.string().optional(),
    data: z.record(z.string()).optional(),
});

const UploadRequestOptionsSchema = RequestOptionsSchema.extend({
    skipBytes: z.number().optional(),
    method: z.string().optional(),
    multipart: MultipartUploadConfigSchema.optional(),
});

export const validateAPIClientConfiguration = (
    config: APIClientConfiguration
) => {
    const result = APIClientConfigurationSchema.safeParse(config);
    if (!result.success) {
        console.warn(result.error); // eslint-disable-line no-console
    }
};

export const validateRequestOptions = (options?: RequestOptions) => {
    if (options) {
        const result = RequestOptionsSchema.safeParse(options);
        if (!result.success) {
            console.warn(result.error); // eslint-disable-line no-console
        }
    }
};

export const validateUploadRequestOptions = (
    options?: UploadRequestOptions
) => {
    if (options) {
        const result = UploadRequestOptionsSchema.safeParse(options);
        if (!result.success) {
            console.warn(result.error); // eslint-disable-line no-console
        }
    }
};
