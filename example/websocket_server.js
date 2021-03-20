// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const webSocketServer = require('./servers/websocket_server');
const argv            = require('yargs').argv;
const colors          = require('colors');
const port            = argv.p || argv.port;

if (!port) {
    console.log([
        "WebSocket Server",
        "",
        "Usage:",
        "  node websocket_server.js -p PORT",
        "",
        "Options:",
        "  -p, --port=PORT    - Port to listen on",
        "",
        "Example:",
        "  node websocket_server.js -p 3000"
    ].join("\n"));
} else {
    webSocketServer(port);
    console.log('WebSocket Server serving at '
        + 'ws://localhost:'.green + port.toString().green);
}
