// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    clientCertPassword: "password",
    fastImageServerUrl:
        process.env.FAST_IMAGE_SITE_URL ||
        (process.env.IOS ? "http://localhost:8009" : "http://10.0.2.2:8009"),
    fastImageSiteUrl:
        process.env.FAST_IMAGE_SITE_URL || "http://localhost:8009",
    fileUploadServerUrl:
        process.env.FILE_UPLOAD_SITE_URL ||
        (process.env.IOS ? "http://localhost:8008" : "http://10.0.2.2:8008"),
    fileUploadSiteUrl:
        process.env.FILE_UPLOAD_SITE_URL || "http://localhost:8008",
    secureFastImageServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/e2e-cert/example/certs/secure_fast_image_server_client_cert.p12",
    secureFastImageServerUrl:
        process.env.SECURE_FAST_IMAGE_SITE_URL ||
        (process.env.IOS ? "https://localhost:9009" : "https://10.0.2.2:9009"),
    secureFastImageSiteUrl:
        process.env.SECURE_FAST_IMAGE_SITE_URL || "https://localhost:9009",
    secureFileUploadServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/e2e-cert/example/certs/secure_file_upload_server_client_cert.p12",
    secureFileUploadServerUrl:
        process.env.SECURE_FILE_UPLOAD_SITE_URL ||
        (process.env.IOS ? "https://localhost:9008" : "https://10.0.2.2:9008"),
    secureFileUploadSiteUrl:
        process.env.SECURE_FILE_UPLOAD_SITE_URL || "https://localhost:9008",
    secureServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/e2e-cert/example/certs/secure_mockserver_client_cert.p12",
    secureServerUrl:
        process.env.SECURE_SITE_URL ||
        (process.env.IOS ? "https://localhost:9080" : "https://10.0.2.2:9080"),
    secureSiteUrl: process.env.SECURE_SITE_URL || "https://localhost:9080",
    secureWebSocketServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/e2e-cert/example/certs/secure_websocket_server_client_cert.p12",
    secureWebSocketServerUrl:
        process.env.SECURE_WEBSOCKET_URL ||
        (process.env.IOS ? "wss://localhost:4000" : "wss://10.0.2.2:4000"),
    secureWebSocketSiteUrl:
        process.env.SECURE_WEBSOCKET_URL || "wss://localhost:4000",
    serverUrl:
        process.env.SITE_URL ||
        (process.env.IOS ? "http://localhost:8080" : "http://10.0.2.2:8080"),
    siteUrl: process.env.SITE_URL || "http://localhost:8080",
    webSocketServerUrl:
        process.env.WEBSOCKET_URL ||
        (process.env.IOS ? "ws://localhost:3000" : "ws://10.0.2.2:3000"),
    webSocketSiteUrl: process.env.WEBSOCKET_URL || "ws://localhost:3000",
};
