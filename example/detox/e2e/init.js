// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestexpect from 'expect';

const http = require('http');
const mockserver = require('mockserver');

beforeAll(async () => {
    launchMockserver();

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

function launchMockserver() {
    const mockserverUrl = 'http://localhost:8080';
    const mockserverRunningMessage = `Mockserver running at ${mockserverUrl}`;

    // Check if mockserver is running
    http.get(mockserverUrl, (res) => {
        jestexpect(res.statusCode).toBe(200);
        console.log(mockserverRunningMessage);
    }).on('error', (e) => {
        // Launch mockserver if not running
        console.log('MOCKSERVER NOT RUNNING! Launching mockserver...');
        http.createServer(mockserver('../mocks')).listen(8080);
        console.log(mockserverRunningMessage);
    });
}
