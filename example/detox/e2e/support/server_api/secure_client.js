// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import axios from "axios";

import testConfig from "../test_config";

const fs = require("fs");
const https = require("https");
const path = require("path");
const certs = "../certs";
const httpsAgent = new https.Agent({
    key: fs.readFileSync(path.join(certs, "client_key.pem")),
    cert: fs.readFileSync(path.join(certs, "client_cert.pem")),
    passphrase: testConfig.clientCertPassword,
    rejectUnauthorized: false, // (NOTE: this will disable client verification)
});

export const secureClient = axios.create({
    baseURL: testConfig.secureSiteUrl,
    headers: { "X-Requested-With": "XMLHttpRequest" },
    httpsAgent,
});

export default secureClient;
