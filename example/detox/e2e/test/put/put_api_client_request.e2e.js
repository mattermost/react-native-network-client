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
    customBody,
    customHeaders,
    newHeaders,
    performApiClientRequest,
    verifyApiClient,
    verifyApiResponse,
    verifyResponseOverlay,
} from '../helpers';

describe('Put - API Client Request', () => {
    const testMethod = 'PUT';
    const testPath = `/${testMethod.toLowerCase()}`;
    const testBaseUrl = serverUrl;
    const testServerUrl = `${testBaseUrl}${testPath}`;
    const testSiteUrl = `${siteUrl}${testPath}`;
    const testHost = host;
    const testStatus = 200;
    const testName = 'Mockserver API';
    const testHeaders = {...newHeaders};
    const testBody = {...customBody};
    const combinedHeaders = {
        ...customHeaders,
        ...newHeaders,
    }

    beforeAll(async () => {
        const apiResponse = await Request.apiPut({headers: testHeaders, body: testBody});
        await verifyApiResponse(apiResponse, testSiteUrl, testStatus, testHost, testMethod, testHeaders, testBody);

        await ApiClientScreen.open(testName);
        await verifyApiClient(testName, testBaseUrl, customHeaders);
        await ApiClientScreen.selectPut();
    });

    it('should return a valid response', async () => {
        // # Perform API client request
        await performApiClientRequest({testPath, testHeaders, testBody});

        // * Verify response overlay
        await verifyResponseOverlay(testServerUrl, testStatus, testHost, testMethod, combinedHeaders, testBody);
    });
});
