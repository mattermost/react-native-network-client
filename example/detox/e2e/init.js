// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import jestexpect from 'expect';
import {siteUrl} from '@support/test_config';

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
    const runningMessage = `Mockserver running at ${siteUrl}`;

    // Check if mockserver is running
    http.get(siteUrl, (res) => {
        jestexpect(res.statusCode).toBe(200);
        console.log(runningMessage);
    }).on('error', (e) => {
        // Launch mockserver if not running
        console.log('MOCKSERVER NOT RUNNING! Launching mockserver...');
        http.createServer(mockserver('../mocks')).listen(8080);
        console.log(runningMessage);
    });
}
