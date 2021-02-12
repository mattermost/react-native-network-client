// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Request} from '@support/server_api';
import {
    host,
    siteUrl,
    serverUrl,
} from '@support/test_config';
import {ApiClientScreen} from '@support/ui/screen';
import {
    customHeaders,
    newHeaders,
    performApiClientRequest,
    verifyApiClient,
    verifyApiResponse,
    verifyResponseOverlay,
} from '../helpers';

describe('Get - API Client Request', () => {
    const testMethod = 'GET';
    const testPath = `/${testMethod.toLowerCase()}`;
    const testBaseUrl = serverUrl;
    const testServerUrl = `${testBaseUrl}${testPath}`;
    const testSiteUrl = `${siteUrl}${testPath}`;
    const testHost = host;
    const testStatus = 200;
    const testName = 'Mockserver API';
    const testHeaders = {...newHeaders};
    const combinedHeaders = {
        ...customHeaders,
        ...newHeaders,
    }

    beforeAll(async () => {
        const apiResponse = await Request.apiGet({headers: testHeaders});
        await verifyApiResponse(apiResponse, testSiteUrl, testStatus, testHost, testMethod, testHeaders);

        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.getButton.tap();
    });

    it('should return a valid response', async () => {
        // # Perform generic client request
        await performApiClientRequest({testPath, testHeaders});

        // * Verify response overlay
        await verifyResponseOverlay(testServerUrl, testStatus, testHost, testMethod, combinedHeaders);
    });
});
