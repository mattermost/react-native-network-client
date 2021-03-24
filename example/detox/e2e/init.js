// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestexpect from "expect";
import {
    fastImageSiteUrl,
    fileUploadSiteUrl,
    siteUrl,
    secureSiteUrl,
    webSocketSiteUrl,
} from "@support/test_config";

const http = require("http");
const https = require("https");
const mockserver = require("mockserver");
const fileServer = require("../../servers/file_server");
const secureServer = require("../../servers/secure_server");
const webSocketServer = require("../../servers/websocket_server");

beforeAll(async () => {
    launchMockserver();
    launchFastImageServer();
    launchFileUploadServer();
    launchWebSocketServer();
    launchSecureServer();

    await device.launchApp({
        newInstance: false,
        launchArgs: { detoxPrintBusyIdleResources: "YES" },
        permissions: {
            notifications: "YES",
            camera: "YES",
            medialibrary: "YES",
            photos: "YES",
        },
    });
});

function launchFastImageServer() {
    launchServer(
        "Fast Image Server",
        fileServer,
        fastImageSiteUrl,
        "./e2e/support/fixtures"
    );
}

function launchFileUploadServer() {
    launchServer(
        "File Upload Server",
        fileServer,
        fileUploadSiteUrl,
        "../upload"
    );
}

function launchMockserver() {
    launchServer("Mockserver", mockserver, siteUrl, "../mocks");
}

function launchWebSocketServer() {
    const port = webSocketSiteUrl.split(":")[2];
    webSocketServer(port);
    console.log(`WebSocket Server listening at ${webSocketSiteUrl}`);
}

function launchSecureServer() {
    const certs = "../certs";
    const opts = {
        key: fs.readFileSync(path.join(certs, "server_key.pem")),
        cert: fs.readFileSync(path.join(certs, "server_cert.pem")),
        requestCert: true,
        rejectUnauthorized: false, // so we can do own error handling
        ca: [fs.readFileSync(path.join(certs, "server_cert.pem"))],
    };
    launchServer("Secure Server", secureServer, secureSiteUrl, "", opts, https);
}

function launchServer(
    serverName,
    requestListener,
    url,
    directory = "",
    opts = {},
    protocol = http
) {
    const port = url.split(":")[2];
    const listeningMessage = `${serverName} listening at ${url}`;
    const notListeningMessage = `${serverName} not listening at port ${port}! Launching ${serverName} (directory: ${directory}) ...`;

    // Check if server is listening
    protocol
        .get(url, (res) => {
            jestexpect(res.statusCode).toBe(200);
            console.log(listeningMessage);
        })
        .on("error", (e) => {
            // Launch server if not listening
            console.log(notListeningMessage);
            const listener = directory
                ? requestListener(directory)
                : requestListener();
            const server = protocol.createServer(opts, listener).listen(port);
            checkServerStatus(server, listeningMessage);
        });
}

function checkServerStatus(server, listeningMessage) {
    server.on("listening", () => {
        console.log(listeningMessage);
    });
    server.on("error", (err) => {
        console.log(err);
        process.exit(1);
    });
}
