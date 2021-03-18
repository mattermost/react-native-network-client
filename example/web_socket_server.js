// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const webSocketServer = require('./servers/web_socket_server');
const argv            = require('yargs').argv;
const colors          = require('colors');
const port            = argv.p || argv.port;

if (!port) {
    console.log([
        "Web Socket Server",
        "",
        "Usage:",
        "  node web_socket_server.js -p PORT",
        "",
        "Options:",
        "  -p, --port=PORT    - Port to listen on",
        "",
        "Example:",
        "  node web_socket_server.js -p 3000"
    ].join("\n"));
} else {
    webSocketServer(port);
    console.log('Web Socket Server serving at '
        + 'ws://localhost:'.green + port.toString().green);
}
