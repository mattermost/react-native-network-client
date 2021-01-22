// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Request} from '@support/server_api';
import testConfig from '@support/test_config';
import {ApiClientScreen} from '@support/ui/screen';
import {
    customBody,
    customHeaders,
    newHeaders,
    performApiClientRequest,
    verifyApiResponse,
    verifyResponseOverlay,
} from '../helpers';

describe('Patch - API Client Request', () => {
    const testMethod = 'PATCH';
    const testPath = `/${testMethod.toLowerCase()}`;
    const testUrl = `${testConfig.siteUrl}${testPath}`;
    const testHost = testConfig.host;
    const testStatus = 200;
    const testHeaders = {...newHeaders};
    const testBody = {...customBody};
    const combinedHeaders = {
        ...customHeaders,
        ...newHeaders,
    }

    beforeAll(async () => {
        const apiResponse = await Request.apiPatch({headers: testHeaders, body: testBody});
        await verifyApiResponse(apiResponse, testUrl, testStatus, testHost, testMethod, testHeaders, testBody);

        await ApiClientScreen.open('Mockserver');
        await ApiClientScreen.patchButton.tap();
    });

    it('should return a valid response', async () => {
        // # Perform generic client request
        await performApiClientRequest({testPath, testHeaders, testBody});

        // * Verify response overlay
        await verifyResponseOverlay(testUrl, testStatus, testHost, testMethod, combinedHeaders, testBody);
    });
});
