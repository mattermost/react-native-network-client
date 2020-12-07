// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { NativeModules } from "react-native";
const { NetworkConstants } = NativeModules;

export default {
    EXPONENTIAL_RETRY: NetworkConstants.EXPONENTIAL_RETRY,
} as NativeConstants;
