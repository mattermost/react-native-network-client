// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    clientCertPassword: "password",
    fileDownloadServerUrl:
        process.env.FAST_IMAGE_SITE_URL ||
        (process.env.IOS ? "http://127.0.0.1:8009" : "http://10.0.2.2:8009"),
    fileDownloadSiteUrl:
        process.env.FAST_IMAGE_SITE_URL || "http://127.0.0.1:8009",
    fileUploadServerUrl:
        process.env.FILE_UPLOAD_SITE_URL ||
        (process.env.IOS ? "http://127.0.0.1:8008" : "http://10.0.2.2:8008"),
    fileUploadSiteUrl:
        process.env.FILE_UPLOAD_SITE_URL || "http://127.0.0.1:8008",
    secureFileDownloadServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/master/example/certs/secure_file_download_server_client_cert.p12",
    secureFileDownloadServerUrl:
        process.env.SECURE_FAST_IMAGE_SITE_URL ||
        (process.env.IOS ? "https://127.0.0.1:9009" : "https://10.0.2.2:9009"),
    secureFileDownloadSiteUrl:
        process.env.SECURE_FAST_IMAGE_SITE_URL || "https://127.0.0.1:9009",
    secureFileUploadServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/master/example/certs/secure_file_upload_server_client_cert.p12",
    secureFileUploadServerUrl:
        process.env.SECURE_FILE_UPLOAD_SITE_URL ||
        (process.env.IOS ? "https://127.0.0.1:9008" : "https://10.0.2.2:9008"),
    secureFileUploadSiteUrl:
        process.env.SECURE_FILE_UPLOAD_SITE_URL || "https://127.0.0.1:9008",
    secureServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/master/example/certs/secure_mockserver_client_cert.p12",
    secureServerUrl:
        process.env.SECURE_SITE_URL ||
        (process.env.IOS ? "https://127.0.0.1:9080" : "https://10.0.2.2:9080"),
    secureSiteUrl: process.env.SECURE_SITE_URL || "https://127.0.0.1:9080",
    secureWebSocketServerClientCertUrl:
        "https://github.com/mattermost/react-native-network-client/raw/master/example/certs/secure_websocket_server_client_cert.p12",
    secureWebSocketServerUrl:
        process.env.SECURE_WEBSOCKET_URL ||
        (process.env.IOS ? "wss://127.0.0.1:4000" : "wss://10.0.2.2:4000"),
    secureWebSocketSiteUrl:
        process.env.SECURE_WEBSOCKET_URL || "wss://127.0.0.1:4000",
    serverUrl:
        process.env.SITE_URL ||
        (process.env.IOS ? "http://127.0.0.1:8080" : "http://10.0.2.2:8080"),
    siteUrl: process.env.SITE_URL || "http://127.0.0.1:8080",
    webSocketServerUrl:
        process.env.WEBSOCKET_URL ||
        (process.env.IOS ? "ws://127.0.0.1:3000" : "ws://10.0.2.2:3000"),
    webSocketSiteUrl: process.env.WEBSOCKET_URL || "ws://127.0.0.1:3000",
};
