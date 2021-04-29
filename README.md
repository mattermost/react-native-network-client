# react-native-network-client

Configurable network clients for React Native. Uses Alamofire for iOS and OkHttp for Android.

## Installation

TODO: Update installation instructions once package is published.
If installing this locally, you will also need to update your applications Podfile to use our fork of Starscream. See the [example app's Podfile](https://github.com/mattermost/react-native-network-client/blob/master/example/ios/Podfile#L27).

```sh

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

  | Code | Reason                                                                                                                     |
  | ---- | -------------------------------------------------------------------------------------------------------------------------- |
  | -100 | Retrieval of a client certificate from the Keychain failed due to `SecIdentityCopyCertificate` returning a nil certificate |
  | -101 | Retrieval of a client certificate from the Keychain failed due to `SecItemCopyMatching` returning a nil `SecIdentity`      |
  | -102 | Storage of a bearer authentication token in the Keychain failed due an invalid token data                                  |
  | -103 | Importing of a PKCS#12 file failed due to an invalid file path                                                             |
  | -104 | Importing of a PKCS#12 file failed due to invalid file contents                                                            |
  | -105 | Importing of a PKCS#12 file failed due to identity already existing in Keychain                                            |
  | -106 | Retrieval/storage of a token failed due to an invalid server URL                                                           |
  | -107 | Retrieval/storage of a client certificate failed due to an invalid host                                                    |
  | -108 | Importing of a PKCS#12 file failed due to an incorrect or missing password                                                 |

- APIClient specific errors will be in the range -200 to -299

  | Code | Reason                                                   |
  | ---- | -------------------------------------------------------- |
  | -200 | SSL handshake failed due to a missing client certificate |

## Method Swizzling

There may be cases where network requests are made by another dependency of your app, for example, [react-native-fast-image](https://github.com/DylanVann/react-native-fast-image), and you'll want those requests to adopt the configuration of your `react-native-network-client` created client. While there might be a cleaner solution to this, we've opted for method swizzling for our own use case at Mattermost. You can find an example of how to do this in `example/ios/SDWebImageDownloaderOperation+Swizzle.m`. The specific swizzle code to write will depend on your dependency and on the dependency version as well since method implementations change.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
