// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const http = require("http");
const https = require("https");
const url = require("url");
const WebSocket = require("ws");

const webSocketServer = (port, { secure = false, serverOptions = {} } = {}) => {
    const server = secure
        ? https.createServer(serverOptions)
        : http.createServer();
    const wss = new WebSocket.Server({ server });

    // On server connection
    wss.on("connection", (ws, request, client) => {
        console.log("WebSocket connected!");
        ws.send("connected");

        const expectedPathname = "/api/websocket";
        const actualPathname = url.parse(request.url).pathname;
        if (actualPathname === expectedPathname) {
            ws.on("message", (message) => {
                console.log(`Received: ${message}`);
                ws.send(message);
            });
        } else {
            console.log(`Invalid path: ${actualPathname}`);
            ws.send(
                `invalid: ${actualPathname}, expected: ${expectedPathname}`
            );
        }

        ws.on("close", function close() {
            console.log("WebSocket disconnected!");
        });
    });

    // On error
    wss.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
            console.log(
                `Another WebSocket Server instance is already listening at ${port}`
            );
        }
    });

    // Listen on port
    server.listen(port);

    return server;
};

module.exports = webSocketServer;
