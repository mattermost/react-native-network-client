// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const fs = require("fs");
const path = require("path");
const webSocketServer = require("./servers/websocket_server");
const argv = require("yargs").argv;
const colors = require("colors");
const certs = argv.c || argv.certs;
const port = argv.p || argv.port;

if (!port) {
    console.log(
        [
            "WebSocket Server",
            "",
            "Usage:",
            "  node websocket_server.js -p PORT -c PATH",
            "",
            "Options:",
            "  -p, --port=PORT    - Port to listen on",
            "  -c, --certs=PATH   - Path to cert files",
            "",
            "Examples:",
            "  non-secure --> node websocket_server.js -p 3000",
            "  secure     --> node websocket_server.js -p 4000 -c './certs'",
        ].join("\n")
    );
} else {
    if (certs) {
        const serverOptions = {
            key: fs.readFileSync(path.join(certs, "server_key.pem")),
            cert: fs.readFileSync(path.join(certs, "server_cert.pem")),
            requestCert: true,
            rejectUnauthorized: false, // so we can do own error handling
            ca: [fs.readFileSync(path.join(certs, "server_cert.pem"))],
        };
        webSocketServer(port, { secure: true, serverOptions });
        console.log(
            "Secure WebSocket Server serving with certs under " +
                certs.green +
                " at " +
                "wss://localhost:".green +
                port.toString().green
        );
    } else {
        webSocketServer(port);
        console.log(
            "WebSocket Server serving at " +
                "ws://localhost:".green +
                port.toString().green
        );
    }
}
