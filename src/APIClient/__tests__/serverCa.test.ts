// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { getOrCreateAPIClient } from "../index";
import NativeApiClient from "../NativeApiClient";
import { validateAPIClientConfiguration } from "../../schemas";

import type { APIClientConfiguration } from "@mattermost/react-native-network-client";

const mockNativeClient = NativeApiClient as jest.Mocked<typeof NativeApiClient>;

jest.mock("../NativeApiClient", () => ({
    __esModule: true,
    default: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
        createClientFor: jest.fn().mockResolvedValue(undefined),
    },
    RetryTypes: {
        LINEAR_RETRY: "linear",
        EXPONENTIAL_RETRY: "exponential",
    },
    ApiClientEvents: {
        DOWNLOAD_PROGRESS: "ApiClient-DownloadProgress",
        UPLOAD_PROGRESS: "ApiClient-UploadProgress",
        CLIENT_ERROR: "ApiClient-Error",
        SESSION_ATTRIBUTES_NETWORK_CHANGED:
            "ApiClient-SessionAttributesNetworkChanged",
    },
}));

const PEM =
    "-----BEGIN CERTIFICATE-----\nMIIBszCCAVmgAwIBAgIUTest\n-----END CERTIFICATE-----\n";

// Each test uses a unique URL to avoid the module-level CLIENTS singleton state.
let urlCounter = 0;
const nextUrl = () => `https://10.0.0.${++urlCounter}:8065`;

describe("serverCa session configuration", () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    describe("validateAPIClientConfiguration", () => {
        it("should accept a PEM string as serverCa", () => {
            validateAPIClientConfiguration({
                sessionConfiguration: { serverCa: PEM },
            });

            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("should accept a configuration without serverCa", () => {
            validateAPIClientConfiguration({
                sessionConfiguration: { collectMetrics: true },
            });

            expect(warnSpy).not.toHaveBeenCalled();
        });

        it.each([
            ["a number", 42],
            ["an object", { pem: PEM }],
            ["an array", [PEM]],
            ["a boolean", true],
        ])("should warn when serverCa is %s", (_label, serverCa) => {
            validateAPIClientConfiguration({
                sessionConfiguration: { serverCa },
            } as unknown as APIClientConfiguration);

            expect(warnSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("getOrCreateAPIClient", () => {
        it("should pass serverCa through to the native client unchanged", async () => {
            const url = nextUrl();
            const config: APIClientConfiguration = {
                sessionConfiguration: {
                    collectMetrics: true,
                    serverCa: PEM,
                },
            };

            const { client, created } = await getOrCreateAPIClient(url, config);

            expect(created).toBe(true);
            expect(client.config.sessionConfiguration?.serverCa).toBe(PEM);
            expect(mockNativeClient.createClientFor).toHaveBeenCalledWith(
                url,
                expect.objectContaining({
                    sessionConfiguration: expect.objectContaining({
                        serverCa: PEM,
                    }),
                }),
            );
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("should not add serverCa when it is not configured", async () => {
            const url = nextUrl();

            await getOrCreateAPIClient(url, {
                sessionConfiguration: { collectMetrics: true },
            });

            const [, nativeConfig] =
                mockNativeClient.createClientFor.mock.calls[0];
            expect(nativeConfig!!.sessionConfiguration).not.toHaveProperty(
                "serverCa",
            );
        });

        it("should not set serverCa in the default configuration", async () => {
            const url = nextUrl();

            await getOrCreateAPIClient(url);

            const [, nativeConfig] =
                mockNativeClient.createClientFor.mock.calls[0];
            expect(nativeConfig!!.sessionConfiguration).not.toHaveProperty(
                "serverCa",
            );
        });

        it("should accept an IP-only server URL with a custom CA", async () => {
            const url = "https://10.20.30.40";

            const { created } = await getOrCreateAPIClient(url, {
                sessionConfiguration: { serverCa: PEM },
            });

            expect(created).toBe(true);
            expect(mockNativeClient.createClientFor).toHaveBeenCalledWith(
                url,
                expect.anything(),
            );
        });

        it("should keep the original serverCa for an existing client", async () => {
            // getOrCreateAPIClient returns the cached client, so callers must
            // invalidate it before a new CA can take effect.
            const url = nextUrl();
            await getOrCreateAPIClient(url, {
                sessionConfiguration: { serverCa: PEM },
            });

            const { client, created } = await getOrCreateAPIClient(url, {
                sessionConfiguration: { serverCa: "another CA" },
            });

            expect(created).toBe(false);
            expect(client.config.sessionConfiguration?.serverCa).toBe(PEM);
            expect(mockNativeClient.createClientFor).toHaveBeenCalledTimes(1);
        });
    });
});
