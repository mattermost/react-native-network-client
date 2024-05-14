import { type TurboModule, TurboModuleRegistry } from "react-native";
import type {
    Double,
    Int32,
    UnsafeObject,
    WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

type ClientResponse = Readonly<{
    headers?: UnsafeObject;
    data?: UnsafeObject;
    code: Int32;
    redirectUrls?: string[];
    ok: boolean;
    retriesExhausted?: boolean;
    path?: string;
}>;

enum RetryTypes {
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

type RequestOptions = Readonly<{
    headers?: ClientHeaders;
    body?: UnsafeObject;
    timeoutInterval?: number;
    retryPolicyConfiguration?: RetryPolicyConfiguration;
}>;

export interface Spec extends TurboModule {
    head(url: string, options?: RequestOptions): Promise<ClientResponse>;
    get(url: string, options?: RequestOptions): Promise<ClientResponse>;
    put(url: string, options?: RequestOptions): Promise<ClientResponse>;
    post(url: string, options?: RequestOptions): Promise<ClientResponse>;
    patch(url: string, options?: RequestOptions): Promise<ClientResponse>;
    methodDelete(
        url: string,
        options?: RequestOptions,
    ): Promise<ClientResponse>;
}

export default TurboModuleRegistry.get<Spec>("GenericClient") as Spec | null;
