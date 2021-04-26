# Example Application

### iOS local setup
1. Install [applesimutils](https://github.com/wix/AppleSimulatorUtils):
```
brew tap wix/brew
brew install applesimutils
```
2. Set XCode’s build location so that the built app, especially debug, is expected at the project’s location instead of the Library’s folder which is unique/hashed.
3. Open XCode, then go to **XCode > Preferences > Locations**.
4. Under **Derived Data**, click **Advanced…**.
5. Select **Custom > Relative to Workspace**, then set **Products** as **Build/Products**.
6. Click **Done** to save the changes.

### Android local setup
1. Install the latest Android SDK.
```
sdkmanager "system-images;android-30;google_apis;x86"
sdkmanager --licenses
```
2. Create the emulator using `npm run e2e:android-create-emulator` from the `/detox` folder. Android testing requires an emulator named `detox_emu_api_30` and the script helps to create it automatically.

### How to install the example application
1. Clean install node modules for the example application.
```
rm -rf node_modules
npm install
```
2. Install the example application to simulator/emulator device.

iOS,
```
cd ios
pod install
cd ..
npm run ios
```
Android,
```
npm run android
```

### How to run Detox E2E tests against the example application
1. Run the mockserver, fast image server, file upload server, and WebSocket server. Follow instructions at
- [How to run Mockserver](MOCKSERVER.md#how-to-run-mockserver)
- [How to run Fast Image Server](FILESERVER.md#how-to-run-fast-image-server)
- [How to run File Upload Server](FILESERVER.md#how-to-run-file-upload-server)
- [How to run WebSocket Server](WEBSOCKETSERVER.md#how-to-run-websocket-server)

**Important:** Detox tests require that the Mockserver, Fast Image Server, File Upload Server, and WebSocket Server are running. If they're not running, then the test will launch them.

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
npm run e2e:android-build
npm run e2e:android-test
```
5. To run a specific test file, append the path to the test file like in the example below,
```
npm run e2e:ios-test -- e2e/test/get/get_generic_client_request.e2e.js
```

For more detailed information on Detox, please visit the official [Detox Documentation](https://github.com/wix/Detox/blob/master/docs/README.md).

Note: Before running tests, toggle off smart punctuation to disable smart quotes on device. For iOS, go to *Settings > General > Keyboard*, and toggle off **Smart Punctuation**.
