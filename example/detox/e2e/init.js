// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    fastImageSiteUrl,
    fileUploadSiteUrl,
    secureFastImageSiteUrl,
    secureFileUploadSiteUrl,
    secureSiteUrl,
    secureWebSocketSiteUrl,
    siteUrl,
    webSocketSiteUrl,
} from "@support/test_config";

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const mockserver = require("../../servers/mockserver");
const fileServer = require("../../servers/file_server");
const webSocketServer = require("../../servers/websocket_server");

const certs = "../certs";
const secureServerOptions = {
    key: fs.readFileSync(path.join(certs, "server_key.pem")),
    cert: fs.readFileSync(path.join(certs, "server_cert.pem")),
    requestCert: true,
    rejectUnauthorized: false, // so we can do own error handling
    ca: [fs.readFileSync(path.join(certs, "server_cert.pem"))],
};

beforeAll(async () => {
    launchMockserver();
    launchSecureMockserver();
    launchFastImageServer();
    launchSecureFastImageServer();
    launchFileUploadServer();
    launchSecureFileUploadServer();
    launchWebSocketServer();
    launchSecureWebSocketServer();

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
    launchServer("Fast Image Server", fileServer, fastImageSiteUrl, {
        directory: "./e2e/support/fixtures",
        secure: false,
    });
}

function launchSecureFastImageServer() {
    launchServer(
        "Secure Fast Image Server",
        fileServer,
        secureFastImageSiteUrl,
        { directory: "./e2e/support/fixtures", secure: true },
        secureServerOptions,
        https
    );
}

function launchFileUploadServer() {
    launchServer("File Upload Server", fileServer, fileUploadSiteUrl, {
        directory: "../upload",
        secure: false,
    });
}

function launchSecureFileUploadServer() {
    launchServer(
        "Secure File Upload Server",
        fileServer,
        secureFileUploadSiteUrl,
        { directory: "../upload", secure: true },
        secureServerOptions,
        https
    );
}

function launchMockserver() {
    launchServer("Mockserver", mockserver, siteUrl, { secure: false });
}

function launchSecureMockserver() {
    launchServer(
        "Secure Mockserver",
        mockserver,
        secureSiteUrl,
        { secure: true },
        secureServerOptions,
        https
    );
}

function launchWebSocketServer() {
    const port = webSocketSiteUrl.split(":")[2];
    webSocketServer(port, { secure: false });
    console.log(`WebSocket Server listening at ${webSocketSiteUrl}`);
}

function launchSecureWebSocketServer() {
    const port = secureWebSocketSiteUrl.split(":")[2];
    webSocketServer(port, { secure: true, secureServerOptions });
    console.log(
        `Secure WebSocket Server listening at ${secureWebSocketSiteUrl}`
    );
}

function launchServer(
    serverName,
    requestListener,
    url,
    requestListenerParams = {},
    serverOptions = {},
    protocol = http
) {
    console.log(`Launching ${serverName} ...`);
    const port = url.split(":")[2];
    const listeningMessage = `${serverName} listening at ${url} with params (${JSON.stringify(
        requestListenerParams
    )})`;

    // Create server
    const listener = requestListenerParams
        ? requestListener(requestListenerParams)
        : requestListener();
    const server = protocol.createServer(serverOptions, listener).listen(port);

    // Check server status
    checkServerStatus(server, serverName, port, listeningMessage);
}

function checkServerStatus(server, serverName, port, listeningMessage) {
    server.on("listening", () => {
        console.log(listeningMessage);
    });
    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.log(
                `Another ${serverName} instance is already listening at ${port}`
            );
        } else {
            console.log(error);
            process.exit(1);
        }
    });
}
