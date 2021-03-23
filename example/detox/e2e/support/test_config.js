// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
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
    serverUrl:
        process.env.SITE_URL ||
        (process.env.IOS ? "http://localhost:8080" : "http://10.0.2.2:8080"),
    siteUrl: process.env.SITE_URL || "http://localhost:8080",
    webSocketServerUrl:
        process.env.WEBSOCKET_URL ||
        (process.env.IOS ? "ws://localhost:3000" : "ws://10.0.2.2:3000"),
    webSocketSiteUrl: process.env.WEBSOCKET_URL || "ws://localhost:3000",
    host: process.env.HOST || "localhost:8080",
};
