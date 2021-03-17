// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

var http       = require('http');
var mockserver = require('mockserver');
var argv       = require('yargs').argv;
var colors     = require('colors')
var mocks      = argv.m || argv.mocks;
var port       = argv.p || argv.port;

if (!mocks || !port) {
    console.log([
        "Mockserver",
        "",
        "Usage:",
        "  mockserver -p PORT -m PATH",
        "",
        "Options:",
        "  -p, --port=PORT    - Port to listen on",
        "  -m, --mocks=PATH   - Path to mock files",
        "",
        "Example:",
        "  node mockserver.js -p 8080 -m './mocks'"
    ].join("\n"));
} else {
    http.createServer(mockserver(mocks)).listen(port);
    console.log('Mockserver serving mocks '
        + 'under "' + mocks.green  + '" at '
        + 'http://localhost:'.green + port.toString().green);
}
