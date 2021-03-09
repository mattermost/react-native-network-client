// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestexpect from 'expect';
import {
    fastImageSiteUrl,
    fileUploadSiteUrl,
    siteUrl,
} from '@support/test_config';

const http = require('http');
const mockserver = require('mockserver');
const fileServer = require('../../servers/file_server');

beforeAll(async () => {
    launchMockserver();
    launchFastImageServer();
    launchFileUploadServer();

    await device.launchApp({
        newInstance: false,
        launchArgs: {detoxPrintBusyIdleResources: 'YES'},
        permissions: {
            notifications: 'YES',
            camera: 'YES',
            medialibrary: 'YES',
            photos: 'YES',
        },
    });
});

function launchFastImageServer() {
    launchServer('Fast Image Server', fileServer, fastImageSiteUrl, './e2e/support/fixtures');
}

function launchFileUploadServer() {
    launchServer('File Upload Server', fileServer, fileUploadSiteUrl, '../upload');
}

function launchMockserver() {
    launchServer('Mockserver', mockserver, siteUrl, '../mocks');
}

function launchServer(serverName, requestListener, url, directory = '') {
    const port = url.split(':')[2];
    const listeningMessage = `${serverName} listening at ${url}`;
    const notListeningMessage = `${serverName} not listening at port ${port}! Launching ${serverName} (directory: ${directory}) ...`;

    // Check if server is listening
    http.get(url, (res) => {
        jestexpect(res.statusCode).toBe(200);
        console.log(listeningMessage);
    }).on('error', (e) => {
        // Launch server if not listening
        console.log(notListeningMessage);
        const listener = directory ? requestListener(directory) : requestListener();
        const server = http.createServer(listener).listen(port);
        checkServerStatus(server, listeningMessage);
    });
}

function checkServerStatus(server, listeningMessage) {
    server.on('listening', () => {
        console.log(listeningMessage);
    });
    server.on('error', (err) => {
        console.log(err);
        process.exit(1);
    });
}
