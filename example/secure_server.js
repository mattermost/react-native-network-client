// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const fs = require("fs");
const https = require("https");
const path = require("path");
const secureServer = require("./servers/secure_server");
const argv = require("yargs").argv;
const colors = require("colors");
const certs = argv.c || argv.certs;
const port = argv.p || argv.port;

if (!certs || !port) {
    console.log(
        [
            "Secure Server",
            "",
            "Usage:",
            "  node secure_server -p PORT -c PATH",
            "",
            "Options:",
            "  -p, --port=PORT    - Port to listen on",
            "  -c, --certs=PATH   - Path to cert files",
            "",
            "Example:",
            "  node secure_server.js -p 443 -c './certs'",
        ].join("\n")
    );
} else {
    const opts = {
        key: fs.readFileSync(path.join(certs, "server_key.pem")),
        cert: fs.readFileSync(path.join(certs, "server_cert.pem")),
        requestCert: true,
        rejectUnauthorized: false, // so we can do own error handling
        ca: [fs.readFileSync(path.join(certs, "server_cert.pem"))],
    };
    https.createServer(opts, secureServer()).listen(port);
    console.log(
        "Secure Server serving with certs " +
            'under "' +
            certs.green +
            '" at ' +
            "https://localhost:".green +
            port.toString().green
    );
}
