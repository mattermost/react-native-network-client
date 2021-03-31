// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const getBody = () => {
    let requestBody = {};
    if (request.body) {
        requestBody = JSON.parse(request.body);
    }

    return {
        request: {
            url: request.url,
            method: request.method,
            headers: request.headers,
            body: requestBody,
        },
    };
};

module.exports = getBody();
