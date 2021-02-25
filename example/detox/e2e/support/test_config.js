// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    serverUrl: process.env.SITE_URL || (process.env.IOS ? 'http://localhost:8080' : 'http://10.0.2.2:8080'),
    siteUrl: process.env.SITE_URL || 'http://localhost:8080',
    host: process.env.HOST || 'localhost:8080',
};
