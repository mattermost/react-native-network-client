// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { AddHeaders, RetryPolicyConfiguration } from "@support/ui/component";
import { ClientListScreen } from "@support/ui/screen";
import { isAndroid } from "@support/utils";

class CreateApiClientScreen {
    testID = {
        createApiClientScrollView: "create_api_client.scroll_view",
        baseUrlInput: "create_api_client.base_url.input",
        bearerAuthTokenInput: "create_api_client.bearer_auth_token.input",
        nameInput: "create_api_client.name.input",
        maxConnectionsInput: "create_api_client.max_connections.input",
        requestTimeoutIntervalInput:
            "create_api_client.request_timeout_interval.input",
        resourceTimeoutIntervalInput:
            "create_api_client.resource_timeout_interval.input",
    };

    createApiClientScreen = element(by.text("CreateAPIClient"));
    createApiClientScrollView = element(
        by.id(this.testID.createApiClientScrollView)
    );
    baseUrlInput = element(by.id(this.testID.baseUrlInput));
    bearerAuthTokenInput = element(by.id(this.testID.bearerAuthTokenInput));
    maxConnectionsInput = element(by.id(this.testID.maxConnectionsInput));
    nameInput = element(by.id(this.testID.nameInput));
    requestTimeoutIntervalInput = element(
        by.id(this.testID.requestTimeoutIntervalInput)
    );
    resourceTimeoutIntervalInput = element(
        by.id(this.testID.resourceTimeoutIntervalInput)
    );
    alertOnClientErrorCheckboxFalse = element(
        by.text("Alert on client error? [false]")
    );
    alertOnClientErrorCheckboxTrue = element(
        by.text("Alert on client error? [true]")
    );
    allowCellularAccessCheckboxFalse = element(
        by.text("Allow Cellular Access? [false]")
    );
    allowCellularAccessCheckboxTrue = element(
        by.text("Allow Cellular Access? [true]")
    );
    cancelRequestsOn401CheckboxFalse = element(
        by.text("Cancel Requests On 401? [false]")
    );
    cancelRequestsOn401CheckboxTrue = element(
        by.text("Cancel Requests On 401? [true]")
    );
    followRedirectsCheckboxFalse = element(
        by.text("Follow Redirects? [false]")
    );
    followRedirectsCheckboxTrue = element(by.text("Follow Redirects? [true]"));
    trustSelfSignedServerCertificateCheckboxFalse = element(
        by.text("Trust Self-Signed Server Certificate? [false]")
    );
    trustSelfSignedServerCertificateCheckboxTrue = element(
        by.text("Trust Self-Signed Server Certificate? [true]")
    );
    waitsForConnectivityCheckboxFalse = element(
        by.text("Waits For Connectivity? [false]")
    );
    waitsForConnectivityCheckboxTrue = element(
        by.text("Waits For Connectivity? [true]")
    );
    clientListButton = element(by.text("ClientList")).atIndex(0);
    createButton = element(by.text("Create"));

    // convenience props
    toggleOffExponentialRetryCheckbox =
        RetryPolicyConfiguration.toggleOffExponentialRetryCheckbox;
    toggleOnExponentialRetryCheckbox =
        RetryPolicyConfiguration.toggleOnExponentialRetryCheckbox;
    toggleOffLinearRetryCheckbox =
        RetryPolicyConfiguration.toggleOffLinearRetryCheckbox;
    toggleOnLinearRetryCheckbox =
        RetryPolicyConfiguration.toggleOnLinearRetryCheckbox;
    retryLimitInput = RetryPolicyConfiguration.retryLimitInput;
    exponentialBackoffBaseInput =
        RetryPolicyConfiguration.exponentialBackoffBaseInput;
    exponentialBackoffScaleInput =
        RetryPolicyConfiguration.exponentialBackoffScaleInput;

    toBeVisible = async () => {
        await expect(this.createApiClientScreen).toBeVisible();

        return this.createApiClientScreen;
    };

    open = async () => {
        // # Open create API client screen
        await ClientListScreen.addApiClientButton.tap();

        return this.toBeVisible();
    };

    back = async () => {
        if (isAndroid()) {
            await device.pressBack();
        } else {
            await this.clientListButton.tap();
        }
        await expect(this.createApiClientScreen).not.toBeVisible();
    };

    createClient = async () => {
        await this.createButton.tap();
    };

    setBaseUrl = async (url) => {
        await this.baseUrlInput.clearText();
        await this.baseUrlInput.replaceText(url);
        await this.baseUrlInput.tapReturnKey();
    };

    setBearerAuthToken = async (bearerAuthToken) => {
        await this.bearerAuthTokenInput.clearText();
        await this.bearerAuthTokenInput.replaceText(bearerAuthToken);
        await this.bearerAuthTokenInput.tapReturnKey();
    };

    setHeaders = async (headers) => {
        await AddHeaders.setHeaders(headers);
    };

    setMaxConnections = async (maxConnections) => {
        await this.maxConnectionsInput.clearText();
        await this.maxConnectionsInput.replaceText(maxConnections);
        await this.maxConnectionsInput.tapReturnKey();
    };

    setName = async (name) => {
        await this.nameInput.clearText();
        await this.nameInput.replaceText(name);
        await this.nameInput.tapReturnKey();
    };

    setRequestTimeoutInterval = async (requestTimeoutInterval) => {
        await this.requestTimeoutIntervalInput.clearText();
        await this.requestTimeoutIntervalInput.replaceText(
            requestTimeoutInterval
        );
        await this.requestTimeoutIntervalInput.tapReturnKey();
    };

    setResourceTimeoutInterval = async (resourceTimeoutInterval) => {
        await this.resourceTimeoutIntervalInput.clearText();
        await this.resourceTimeoutIntervalInput.replaceText(
            resourceTimeoutInterval
        );
        await this.resourceTimeoutIntervalInput.tapReturnKey();
    };

    setRetry = async (
        options = {
            retryPolicyType: "exponential",
            retryLimit: "2",
            exponentialBackoffBase: "2",
            exponentialBackoffScale: "0.5",
            retryInterval: "2000",
        }
    ) => {
        await RetryPolicyConfiguration.setRetry(options);
    };

    toggleOffAlertOnClientErrorCheckbox = async () => {
        await this.alertOnClientErrorCheckboxTrue.tap();
        await expect(this.alertOnClientErrorCheckboxFalse).toBeVisible();
    };

    toggleOnAlertOnClientErrorCheckbox = async () => {
        await this.alertOnClientErrorCheckboxFalse.tap();
        await expect(this.alertOnClientErrorCheckboxTrue).toBeVisible();
    };

    toggleOffAllowCellularAccessCheckbox = async () => {
        await this.allowCellularAccessCheckboxTrue.tap();
        await expect(this.allowCellularAccessCheckboxFalse).toBeVisible();
    };

    toggleOnAllowCellularAccessCheckbox = async () => {
        await this.allowCellularAccessCheckboxFalse.tap();
        await expect(this.allowCellularAccessCheckboxTrue).toBeVisible();
    };

    toggleOffCancelRequestsOn401Checkbox = async () => {
        await this.cancelRequestsOn401CheckboxTrue.tap();
        await expect(this.cancelRequestsOn401CheckboxFalse).toBeVisible();
    };

    toggleOnCancelRequestsOn401Checkbox = async () => {
        await this.cancelRequestsOn401CheckboxFalse.tap();
        await expect(this.cancelRequestsOn401CheckboxTrue).toBeVisible();
    };

    toggleOffFollowRedirectsCheckbox = async () => {
        await this.followRedirectsCheckboxTrue.tap();
        await expect(this.followRedirectsCheckboxFalse).toBeVisible();
    };

    toggleOnFollowRedirectsCheckbox = async () => {
        await this.followRedirectsCheckboxFalse.tap();
        await expect(this.followRedirectsCheckboxTrue).toBeVisible();
    };

    toggleOffTrustSelfSignedServerCertificateCheckbox = async () => {
        await this.trustSelfSignedServerCertificateCheckboxTrue.tap();
        await expect(
            this.trustSelfSignedServerCertificateCheckboxFalse
        ).toBeVisible();
    };

    toggleOnTrustSelfSignedServerCertificateCheckbox = async () => {
        await this.trustSelfSignedServerCertificateCheckboxFalse.tap();
        await expect(this.trustSelfSignedServerCertificateCheckboxTrue).toBeVisible();
    };

    toggleOffWaitsForConnectivityCheckbox = async () => {
        await this.waitsForConnectivityCheckboxTrue.tap();
        await expect(this.waitsForConnectivityCheckboxFalse).toBeVisible();
    };

    toggleOnWaitsForConnectivityCheckbox = async () => {
        await this.waitsForConnectivityCheckboxFalse.tap();
        await expect(this.waitsForConnectivityCheckboxTrue).toBeVisible();
    };
}

const createApiClientScreen = new CreateApiClientScreen();
export default createApiClientScreen;
