// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const platform = process.env.IOS ? "ios" : "android";

module.exports = {
    setupFilesAfterEnv: ["./init.js"],
    testEnvironment: "./environment",
    testRunner: "jest-circus/runner",
    testTimeout: 120000,
    testRegex: "\\.e2e\\.js$",
    reporters: [
        "../node_modules/detox/runners/jest/streamlineReporter",
        [
            "jest-junit",
            {
                suiteName:
                    "React Native Network Client Example E2E with Detox and Jest",
                outputDirectory: "./artifacts",
                outputName: `${platform}-junit.xml`,
                uniqueOutputName: false,
            },
        ],
        [
            "jest-html-reporters",
            {
                pageTitle:
                    "React Native Network Client Example E2E with Detox and Jest",
                publicPath: "./artifacts",
                filename: `${platform}-report.html`,
                expand: false,
            },
        ],
    ],
    verbose: true,
};
