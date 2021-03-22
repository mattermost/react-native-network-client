# react-native-network-client

Configurable network clients for React Native. Uses Alamofire for iOS and OkHttp for Android.

## Installation

```sh
npm install react-native-network-client
```

## Usage

```js
import GenericClient, {
  getOrCreateAPIClient,
  getOrCreateWebSocketClient,
} from "react-native-network-client";

// ...

const response = await GenericClient.get("https://community.mattermost.com");
const { client: apiClient, created } = await getOrCreateAPIClient(
  "https://community.mattermost.com"
);
const { client: wsClient, created } = await getOrCreateWebSocketClient(
  "wss://community.mattermost.com"
);
```

## Errors

There are two cases where errors will be returned by the native code. The first is via rejected promises and the second is via events.

In the case of rejected promises, the error structure is unchanged from what React Native returns:

```
{
    code: number;
    message: string;
    userInfo: Object;
    domain?: string;
    nativeStackAndroid?: Object;
    nativeStackIOS?: Object;
}
```

API client events will have the following structure:

```
{
    serverUrl: string;
    errorCode: number;
    errorDescription: string;
}
```

and you'll need to subscribe to these events by passing your error handler as a callback to `onClientError(callback: APIClientErrorEventHandler): void;`.

WebSocket client events will have the following structure:

```
{
    url: string;
    errorCode: number;
    errorDescription: string;
}
```

and you'll need to subscribe to these events by passing your error handler as a callback to `onClientError(callback: WebSocketClientErrorEventHandler): void;`.

For both API client and WebSocket client, the following error codes apply:

- Keychain specific errors will be in the range -100 to -199
- APIClient specific errors will be in the range -200 to -299
- General client errors will be in the range -300 to -399

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
