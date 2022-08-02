// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const path = require("path");
const pak = require("../package.json");

module.exports = {
    presets: ["module:metro-react-native-babel-preset"],
    plugins: [
        [
            "module-resolver",
            {
                alias: {
                    [pak.name]: path.join(__dirname, "..", pak.source),
                },
            },
        ],
        'react-native-reanimated/plugin',
    ],
};
