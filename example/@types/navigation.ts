import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";

declare global {
    type NetworkClient =
        | GenericClientInterface
        | APIClientInterface
        | WebSocketClientInterface;

    type GenericClientItem = {
        name: string;
        client: GenericClientInterface;
    };

    type APIClientItem = {
        name: string;
        client: APIClientInterface;
        isMattermostClient?: boolean;
    };

    type WebSocketClientItem = {
        name: string;
        client: WebSocketClientInterface;
    };

    type NetworkClientItem =
        | GenericClientItem
        | APIClientItem
        | WebSocketClientItem;

    type RootStackParamList = {
        APIClient: { item: APIClientItem };
        APIClientRequest: { item: APIClientItem; method: string };
        APIClientUpload: { item: APIClientItem };
        APIClientFastImage: { item: APIClientItem };
        MattermostClientUpload: { item: APIClientItem };
        ClientList: { createdClient: APIClientItem };
        CreateAPIClient: undefined;
        CreateWebSocketClient: undefined;
        GenericClientRequest: { client: GenericClientInterface };
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
}
