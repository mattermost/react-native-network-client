// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const getStatus = () => {
    const defaultStatus = 'HTTP/1.1 200 OK';
    if (!request.headers) {
        return defaultStatus;
    }

    const responseStatus = request.headers['response-status'];
    if (!responseStatus) {
        return defaultStatus;
    }

    return `HTTP/1.1 ${responseStatus}`;
};

module.exports = getStatus();
