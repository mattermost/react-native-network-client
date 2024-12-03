import { type TurboModule, TurboModuleRegistry } from "react-native";
import type {
    Double,
    Int32,
    UnsafeObject,
    WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

type ClientResponseMetrics = {
    networkType: string;
    tlsCipherSuite: string;
    tlsVersion: string;
    httpVersion: string;
    isCached: boolean;
    compressedSize: Double;
    size: Double;
    connectionTime: Double;
    latency: Double;
};

type ClientResponse = Readonly<{
    headers?: UnsafeObject;
    data?: UnsafeObject;
    code: Int32;
    redirectUrls?: string[];
    ok: boolean;
    retriesExhausted?: boolean;
    path?: string;
    metrics?: ClientResponseMetrics;
}>;

export enum RetryTypes {
    EXPONENTIAL_RETRY = "exponential",
    LINEAR_RETRY = "linear",
}

type RetryPolicyConfiguration = Readonly<{
    type?: WithDefault<RetryTypes, "exponential">;
    retryLimit?: Int32;
    retryInterval?: Int32;
    exponentialBackoffBase?: Int32;
    exponentialBackoffScale?: Double;
    statusCodes?: Int32[];
    retryMethods?: string[];
}>;

type ClientHeaders = UnsafeObject;

export type RequestOptions = Readonly<{
    headers?: ClientHeaders;
    body?: UnsafeObject;
    timeoutInterval?: number;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
}>;

type MultipartUploadConfig = Readonly<{
    fileKey?: string;
    data?: UnsafeObject;
}>;

type UploadRequestOptions = RequestOptions &
    Readonly<{
        skipBytes?: Double;
        method?: string;
        multipart?: MultipartUploadConfig;
    }>;

export type SessionConfiguration = {
    allowsCellularAccess?: boolean;
    waitsForConnectivity?: boolean;
    timeoutIntervalForRequest?: Double;
    timeoutIntervalForResource?: Double;
    httpMaximumConnectionsPerHost?: Int32;
    cancelRequestsOnUnauthorized?: boolean;
    trustSelfSignedServerCertificate?: boolean;
};

export type RequestAdapterConfiguration = {
    bearerAuthTokenResponseHeader?: string;
};

export type ClientP12Configuration = Readonly<{
    path: string;
    password?: string;
}>;

export type ApiClientConfiguration = {
    headers?: ClientHeaders;
    sessionConfiguration?: SessionConfiguration;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
    requestAdapterConfiguration?: RequestAdapterConfiguration;
    clientP12Configuration?: ClientP12Configuration;
};

export enum ApiClientEvents {
    DOWNLOAD_PROGRESS = "ApiClient-DownloadProgress",
    UPLOAD_PROGRESS = "ApiClient-UploadProgress",
    CLIENT_ERROR = "ApiClient-Error",
}

export interface Spec extends TurboModule {
    addListener: (eventType: string) => void;
    removeListeners: (count: Int32) => void;

    head(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    get(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    put(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    post(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    patch(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    methodDelete(
        baseUrl: string,
        endpoint: string | null,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    upload(
        baseUrl: string,
        endpoint: string | null,
        fileUrl: string,
        taskId: string,
        options?: UploadRequestOptions,
    ): Promise<ClientResponse>;
    download(
        baseUrl: string,
        endpoint: string | null,
        filePath: string,
        taskId: string,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
    cancelRequest(taskId: string): Promise<void>;

    createClientFor(
        baseUrl: string,
        config?: ApiClientConfiguration,
    ): Promise<void>;

    getClientHeadersFor(baseUrl: string): Promise<ClientHeaders>;
    addClientHeadersFor(baseUrl: string, headers: ClientHeaders): Promise<void>;
    importClientP12For(
        baseUrl: string,
        path: string,
        password?: string,
    ): Promise<void>;
    invalidateClientFor(baseUrl: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>("ApiClient") as Spec;
