import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';


export type Client = {
  name: string,
  type: string,
  baseUrl?: string,
  wsUrl?: string,
  client: GenericClientInterface | APIClientInterface
}

type RootStackParamList = {
  APIClient: {client: Client["client"], name: string}
  ClientList: {client: Client}
  CreateAPIClient: undefined
  CreateWebSocketClient: undefined
  GenericClient: {client: Client["client"], name: string}
}

/* Client List Screen */
type ClientListScreenNavigationProp = StackNavigationProp<
RootStackParamList,
'ClientList'
>;
type ClientListScreenRouteProp = RouteProp<RootStackParamList, 'ClientList'>;

export type ClientListScreenProps = {
  navigation: ClientListScreenNavigationProp;
  route: ClientListScreenRouteProp;
};

/* API Client Screen */
type APIClientScreenNavigationProp = StackNavigationProp<
RootStackParamList,
'APIClient'
>;
type APIClientScreenRouteProp = RouteProp<RootStackParamList, 'APIClient'>;

export type APIClientScreenProps = {
  navigation: APIClientScreenNavigationProp;
  route: APIClientScreenRouteProp;
};

/* Create API Client Screen */
type CreateAPIClientScreenNavigationProp = StackNavigationProp<
RootStackParamList,
'CreateAPIClient'
>;
type CreateAPIClientScreenRouteProp = RouteProp<RootStackParamList, 'CreateAPIClient'>;

export type CreateAPIClientScreenProps = {
  navigation: CreateAPIClientScreenNavigationProp;
  route: CreateAPIClientScreenRouteProp;
};


/* Generic Client Screen */
type GenericClientScreenNavigationProp = StackNavigationProp<
RootStackParamList,
'GenericClient'
>;
type GenericClientScreenRouteProp = RouteProp<RootStackParamList, 'GenericClient'>;

export type GenericClientScreenProps = {
  navigation: GenericClientScreenNavigationProp;
  route: GenericClientScreenRouteProp;
};