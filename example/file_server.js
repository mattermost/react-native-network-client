// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const fileServer = require("./servers/file_server");
const argv = require("yargs").argv;
const colors = require("colors");
const uploadPath = argv.u || argv.upload;
const certs = argv.c || argv.certs;
const port = argv.p || argv.port;

if (!port) {
    console.log(
        [
            "File Server",
            "",
            "Usage:",
            "  node file_server.js -p PORT -u PATH -c PATH",
            "",
            "Options:",
            "  -p, --port=PORT    - Port to listen on",
            "  -u, --upload=PATH  - Path to upload files to",
            "  -c, --certs=PATH   - Path to cert files",
            "",
            "Examples:",
            "  non-secure --> node file_server.js -p 8008 -u './upload'",
            "  secure     --> node file_server.js -p 9008 -u './upload' -c './certs'",
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
            .createServer(
                serverOptions,
                fileServer({ directory: uploadPath, secure: true })
            )
            .listen(port);
        console.log(
            "Secure File Server serving files under " +
                uploadPath.green +
                " with certs under " +
                certs.green +
                " at " +
                "https://localhost:".green +
                port.toString().green
        );
    } else {
        http.createServer(fileServer({ directory: uploadPath })).listen(port);
        console.log(
            "File Server serving files under " +
                uploadPath.green +
                " at " +
                "http://localhost:".green +
                port.toString().green
        );
    }
}
