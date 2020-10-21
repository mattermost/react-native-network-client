# react-native-network-client

Configurable network clients for React Native. Uses Alamofire for iOS and OkHttp for Android.

## Installation

```sh
npm install react-native-network-client
```

## Usage

```js
import NetworkClient from "react-native-network-client";

// ...

const result = await NetworkClient.getOrCreateNetworkClient("https://community.mattermost.com");
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
