const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");
const prettierPlugin = require("eslint-plugin-prettier");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
    {
        ignores: [
            "example/**",
            "lib/**",
            "node_modules/**",
            ".vscode/**",
            ".idea/**",
            ".circleci/**",
        ],
    },
    {
        files: ["**/*.{js,ts,tsx}"],
        plugins: {
            "@typescript-eslint": tseslint,
            prettier: prettierPlugin,
        },
        languageOptions: {
            parser: tsparser,
            globals: {
                __DEV__: true,
            },
        },
        settings: {
            react: {
                pragma: "React",
                version: "19.0",
            },
        },
        rules: {
            ...prettierConfig.rules,
            ...prettierPlugin.configs.recommended.rules,
            "no-undef": "off",
            "no-shadow": "off",
            "no-use-before-define": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    vars: "all",
                    args: "after-used",
                },
            ],
        },
    },
    {
        files: ["**/*.test.js", "**/*.test.jsx"],
        languageOptions: {
            globals: {
                afterAll: true,
                afterEach: true,
                beforeAll: true,
                beforeEach: true,
                describe: true,
                expect: true,
                it: true,
                jest: true,
                test: true,
            },
        },
    },
];
