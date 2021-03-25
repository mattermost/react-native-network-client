// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const mockserver = require("./servers/mockserver");
const argv = require("yargs").argv;
const colors = require("colors");
const certs = argv.c || argv.certs;
const port = argv.p || argv.port;

if (!port) {
    console.log(
        [
            "Mockserver",
            "",
            "Usage:",
            "  node mockserver -p PORT -c PATH",
            "",
            "Options:",
            "  -p, --port=PORT    - Port to listen on",
            "  -c, --certs=PATH   - Path to cert files",
            "",
            "Examples:",
            "  non-secure --> node mockserver.js -p 8080",
            "  secure     --> node mockserver.js -p 4443 -c './certs'",
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
        https
            .createServer(serverOptions, mockserver({ secure: true }))
            .listen(port);
        console.log(
            "Secure Mockserver serving with certs " +
                'under "' +
                certs.green +
                '" at ' +
                "https://localhost:".green +
                port.toString().green
        );
    } else {
        http.createServer(mockserver()).listen(port);
        console.log(
            "Mockserver serving at " +
                "http://localhost:".green +
                port.toString().green
        );
    }
}
