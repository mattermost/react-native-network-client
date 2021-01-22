// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    AddHeaders,
    RetryPolicyConfiguration,
} from '@support/ui/component';
import {ClientListScreen} from '@support/ui/screen';

class CreateApiClientScreen {
    testID = {
        baseUrlInput: 'create_api_client.base_url.input',
        bearerAuthTokenInput: 'create_api_client.bearer_auth_token.input',
        nameInput: 'create_api_client.name.input',
        maxConnectionsInput: 'create_api_client.max_connections.input',
        requestTimeoutIntervalInput: 'create_api_client.request_timeout_interval.input',
        resourceTimeoutIntervalInput: 'create_api_client.resource_timeout_interval.input',
    }

    createApiClientScreen = element(by.text('CreateAPIClient'));
    baseUrlInput = element(by.id(this.testID.baseUrlInput));
    bearerAuthTokenInput = element(by.id(this.testID.bearerAuthTokenInput));
    maxConnectionsInput = element(by.id(this.testID.maxConnectionsInput));
    nameInput = element(by.id(this.testID.nameInput));
    requestTimeoutIntervalInput = element(by.id(this.testID.requestTimeoutIntervalInput));
    resourceTimeoutIntervalInput = element(by.id(this.testID.resourceTimeoutIntervalInput));
    allowCellularAccessCheckbox = element(by.text('Allow Cellular Access?'));
    cancelRequestsOn401Checkbox = element(by.text('Cancel Requests On 401?'));
    followRedirectsCheckbox = element(by.text('Follow Redirects?'));
    waitsForConnectivityCheckbox = element(by.text('Waits For Connectivity?'));
    clientListButton = element(by.text('ClientList')).atIndex(0);
    createButton = element(by.text('Create'));

    // convenience props
    retryCheckbox = RetryPolicyConfiguration.retryCheckbox;
    retryLimitInput = RetryPolicyConfiguration.retryLimitInput;
    exponentialBackoffBaseInput = RetryPolicyConfiguration.exponentialBackoffBaseInput;
    exponentialBackoffScaleInput = RetryPolicyConfiguration.exponentialBackoffScaleInput;

    toBeVisible = async () => {
        await expect(this.createApiClientScreen).toBeVisible();

        return this.createApiClientScreen;
    }

    open = async () => {
        // # Open create api client screen
        await ClientListScreen.addApiClientButton.tap();

        return this.toBeVisible();
    }

    back = async () => {
        await this.clientListButton.tap();
        await expect(this.createApiClientScreen).not.toBeVisible();
    }

    setBaseUrl = async (url) => {
        await this.baseUrlInput.clearText();
        await this.baseUrlInput.replaceText(url);
    }

    setBearerAuthToken = async (bearerAuthToken) => {
        await this.bearerAuthTokenInput.clearText();
        await this.bearerAuthTokenInput.replaceText(bearerAuthToken);
    }

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    }

    setMaxConnections = async (maxConnections) => {
        await this.maxConnectionsInput.clearText();
        await this.maxConnectionsInput.replaceText(maxConnections);
    }

    setName = async (name) => {
        await this.nameInput.clearText();
        await this.nameInput.replaceText(name);
    }

    setRequestTimeoutInterval = async (requestTimeoutInterval) => {
        await this.requestTimeoutIntervalInput.clearText();
        await this.requestTimeoutIntervalInput.replaceText(requestTimeoutInterval);
    }

    setResourceTimeoutInterval = async (resourceTimeoutInterval) => {
        await this.resourceTimeoutIntervalInput.clearText();
        await this.resourceTimeoutIntervalInput.replaceText(resourceTimeoutInterval);
    }
}

const createApiClientScreen = new CreateApiClientScreen();
export default createApiClientScreen;
