# react-native-network-client

Configurable network clients for React Native. Uses Alamofire for iOS and OkHttp for Android.

## About

React Native uses a single **URLSessionConfiguration** and a single **OkHttpClient** for all network requests. In order to introduce multi-server support in the Mattermost mobile app, we need to maintain isolated instances of [URLSession](https://developer.apple.com/documentation/foundation/urlsession) and [OkHttpClient](https://square.github.io/okhttp/4.x/okhttp/okhttp3/-ok-http-client/), each configured individually for a specific server. This library allows you to do just that.

## Installation

```sh
npm install @mattermost/react-native-network-client
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

## Self-signed server certificate

To allow usage of self-signed server certificates you can pass in `sessionConfiguration.trustSelfSignedServerCertificate = true` in the options when creating an APIClient. It is recommended **not** to do this in production code as not only will the certificate be trusted, but the hostname will not be verified against your APIClient `baseUrl`'s hostname. This can open you up to man-in-the-middle attacks.

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
  | -299 | Server SSL certificate is not trusted or invalid         |

## Method Swizzling

There may be cases where network requests are made by another dependency of your app, for example, [react-native-fast-image](https://github.com/DylanVann/react-native-fast-image), [expo-image](https://docs.expo.dev/versions/latest/sdk/image/), or the *Image* component of React Native, and you'll want those requests to adopt the configuration of your `react-native-network-client` created client. 

### iOS:
While there might be a cleaner solution to this, we've opted for method swizzling in IOS for our own use case at Mattermost. You can find an example of how to do this in [example/ios/SDWebImageDownloaderOperation.m](https://github.com/mattermost/react-native-network-client/blob/master/example/ios/SDWebImageDownloaderOperation.m). The specific swizzle code to write will depend on your dependency and on the dependency version as well since method implementations change.

### Android: 
For Android, we provide the interceptor [android/src/main/java/com/mattermost/networkclient/interceptors/RCTClientRequestInterceptor.kt](https://github.com/mattermost/react-native-network-client/blob/master/android/src/main/java/com/mattermost/networkclient/interceptors/RCTClientRequestInterceptor.kt) that adapts the request if an APIClient is found for the request. To make this interceptor active you need to do two things:

1. Add `OkHttpClientProvider.setOkHttpClientFactory(RCTOkHttpClientFactory());` to your `MainApplication`'s `onCreate` function (see [example/android/app/src/main/java/com/example/reactnativenetworkclient/MainApplication.kt](https://github.com/mattermost/react-native-network-client/blob/master/example/android/app/src/main/java/com/example/reactnativenetworkclient/MainApplication.kt#L57)).
2. Ensure that all dependencies use the same version of okhttp3 by adding the following to the dependencies block of your application's `android/app/build.gradle` file (see [example/android/app/build.gradle](https://github.com/mattermost/react-native-network-client/blob/master/example/android/app/build.gradle##L119-L120)):

```
implementation "com.squareup.okhttp3:okhttp:4.12.0"
implementation "com.squareup.okhttp3:okhttp-urlconnection:4.12.0"
```

In case you are using [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) you can include the patch found in [example/patches/expo-image+1.12.9.patch](https://github.com/mattermost/react-native-network-client/blob/master/example/patches/expo-image+1.12.9.patch) and then set the **expo-image** http client to use the one provided by this library in your `MainApplication`'s `onCreate` function and add a call to `ExpoImageOkHttpClientGlideModule.okHttpClient = RCTOkHttpClientFactory().createNewNetworkModuleClient()` (see [example/android/app/src/main/java/com/example/reactnativenetworkclient/MainApplication.kt#L58](https://github.com/mattermost/react-native-network-client/blob/master/example/android/app/src/main/java/com/example/reactnativenetworkclient/MainApplication.kt#L58))


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
