// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    presets: ["module:@react-native/babel-preset"],
    plugins: [
        "@babel/plugin-transform-export-namespace-from",
        'react-native-worklets/plugin',
    ],
};
