import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";

enum ClientType {
    GENERIC,
    API,
    WEBSOCKET,
}

declare global {
    type NetworkClient =
        | GenericClientInterface
        | APIClientInterface
        | WebSocketClientInterface;

    type NetworkClientItem = {
        name: string;
        client: NetworkClient;
        type: ClientType;
        isMattermostClient?: boolean;
    };

    type GenericClientItem = NetworkClientItem & {
        client: GenericClientInterface;
        type: ClientType.GENERIC;
    };

    type APIClientItem = NetworkClientItem & {
        client: APIClientInterface;
        type: ClientType.API;
    };

    type WebSocketClientItem = NetworkClientItem & {
        client: WebSocketClientInterface;
        type: ClientType.WEBSOCKET;
    };

    type RootStackParamList = {
        APIClient: { item: APIClientItem };
        APIClientRequest: { item: APIClientItem; method: string };
        APIClientUpload: { item: APIClientItem };
        APIClientFastImage: { item: APIClientItem };
        APIClientImportP12: { item: APIClientItem };
        MattermostClientUpload: { item: APIClientItem };
        ClientList: { createdClient: NetworkClientItem };
        CreateAPIClient: undefined;
        CreateWebSocketClient: undefined;
        GenericClientRequest: { item: GenericClientItem };
        WebSocketClient: { item: WebSocketClientItem };
    };

    /* Client List Screen */
    type ClientListScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "ClientList"
    >;
    type ClientListScreenRouteProp = RouteProp<
        RootStackParamList,
        "ClientList"
    >;

    type ClientListScreenProps = {
        navigation: ClientListScreenNavigationProp;
        route: ClientListScreenRouteProp;
    };

    /* API Client Screen */
    type APIClientScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "APIClient"
    >;
    type APIClientScreenRouteProp = RouteProp<RootStackParamList, "APIClient">;

    type APIClientScreenProps = {
        navigation: APIClientScreenNavigationProp;
        route: APIClientScreenRouteProp;
    };

    /* API Client Request Screen */
    type APIClientRequestScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "APIClientRequest"
    >;
    type APIClientRequestScreenRouteProp = RouteProp<
        RootStackParamList,
        "APIClientRequest"
    >;

    type APIClientRequestScreenProps = {
        navigation: APIClientRequestScreenNavigationProp;
        route: APIClientRequestScreenRouteProp;
    };

    /* API Client Upload Screen */
    type APIClientUploadScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "APIClientUpload"
    >;
    type APIClientUploadScreenRouteProp = RouteProp<
        RootStackParamList,
        "APIClientUpload"
    >;

    type APIClientUploadScreenProps = {
        navigation: APIClientUploadScreenNavigationProp;
        route: APIClientUploadScreenRouteProp;
    };

    /* API Client Fast Image Screen */
    type APIClientFastImageScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "APIClientFastImage"
    >;
    type APIClientFastImageScreenRouteProp = RouteProp<
        RootStackParamList,
        "APIClientFastImage"
    >;

    type APIClientFastImageScreenProps = {
        navigation: APIClientFastImageScreenNavigationProp;
        route: APIClientFastImageScreenRouteProp;
    };

    /* API Client Import P12 Screen */
    type APIClientImportP12ScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "APIClientImportP12"
    >;
    type APIClientImportP12ScreenRouteProp = RouteProp<
        RootStackParamList,
        "APIClientImportP12"
    >;

    type APIClientImportP12ScreenProps = {
        navigation: APIClientImportP12ScreenNavigationProp;
        route: APIClientImportP12ScreenRouteProp;
    };

    /* Create API Client Screen */
    type CreateAPIClientScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "CreateAPIClient"
    >;
    type CreateAPIClientScreenRouteProp = RouteProp<
        RootStackParamList,
        "CreateAPIClient"
    >;

    type CreateAPIClientScreenProps = {
        navigation: CreateAPIClientScreenNavigationProp;
        route: CreateAPIClientScreenRouteProp;
    };

    /* Generic Client Request Screen */
    type GenericClientRequestScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "GenericClientRequest"
    >;
    type GenericClientRequestScreenRouteProp = RouteProp<
        RootStackParamList,
        "GenericClientRequest"
    >;

    type GenericClientRequestScreenProps = {
        navigation: GenericClientRequestScreenNavigationProp;
        route: GenericClientRequestScreenRouteProp;
    };

    /* Create WebSocket Client Screen */
    type CreateWebSocketClientScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "CreateWebSocketClient"
    >;
    type CreateWebSocketClientScreenRouteProp = RouteProp<
        RootStackParamList,
        "CreateWebSocketClient"
    >;

    type CreateWebSocketClientScreenProps = {
        navigation: CreateWebSocketClientScreenNavigationProp;
        route: CreateWebSocketClientScreenRouteProp;
    };

    /* WebSocket Client Screen */
    type WebSocketClientScreenNavigationProp = StackNavigationProp<
        RootStackParamList,
        "WebSocketClient"
    >;
    type WebSocketClientScreenRouteProp = RouteProp<
        RootStackParamList,
        "WebSocketClient"
    >;

    type WebSocketClientScreenProps = {
        navigation: WebSocketClientScreenNavigationProp;
        route: WebSocketClientScreenRouteProp;
    };
}
