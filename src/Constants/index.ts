// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";
const { RNNCConstants } = NativeModules;

export default {
    EXPONENTIAL_RETRY: RNNCConstants.EXPONENTIAL_RETRY,
} as NativeConstants;
