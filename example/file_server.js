// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const http       = require('http');
const fileServer = require('./servers/file_server');
const argv       = require('yargs').argv;
const colors     = require('colors');
const uploadPath = argv.u || argv.upload;
const port       = argv.p || argv.port;

if (!port) {
    console.log([
        "File Server",
        "",
        "Usage:",
        "  node file_server.js -p PORT -u PATH",
        "",
        "Options:",
        "  -p, --port=PORT    - Port to listen on",
        "  -u, --upload=PATH  - Path to upload files to",
        "",
        "Example:",
        "  node file_server.js -p 8082 -u './upload'"
    ].join("\n"));
} else {
    http.createServer(fileServer(uploadPath)).listen(port);
    console.log('File Server serving files '
        + 'under "' + uploadPath.green  + '" at '
        + 'http://localhost:'.green + port.toString().green);
}
