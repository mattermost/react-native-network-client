# Example Application

### How to install the example application
1. Clean install node modules for the example application.
```
rm -rf node_modules
npm install
```
2. Install the example application to simulator/emulator device.
**Important:** Make sure in your *Xcode > Preferences > Locations > Advanced*, select *Custom > Relative to Workspace > Products > `Build/Products`*

iOS,
```
npm run ios
```
Android,
```
npm run android
```

### How to run Detox E2E tests against the example application
1. Run the mock server. Follow instructions at [How to run Mockserver](MOCKSERVER.md#how-to-run-mockserver).
2. Clean install node modules for detox.
```
cd detox
rm -rf node_modules
npm install
cd ..
```
3. Launch the simulator/emulator device where the example application is installed, then start the react packager/server.
```
npm run start
```
4. Run detox tests.
iOS,
```
cd detox
npm run e2e:ios-test
```
Android,
```
cd detox
npm run e2e:android-test
```
5. To run a specific test file, append the path to the test file like in the example below,
```
npm run e2e:ios-test -- e2e/test/get/get_generic_client_request.e2e.js
```

For more detailed information on Detox, please visit the official [Detox Documentation](https://github.com/wix/Detox/blob/master/docs/README.md).

Note: Before running tests, toggle off smart punctuation to disable smart quotes on device. For iOS, go to *Settings > General > Keyboard*, and toggle off **Smart Punctuation**.
