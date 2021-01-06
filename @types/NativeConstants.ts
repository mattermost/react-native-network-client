// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
type Constants = {
    EXPONENTIAL_RETRY: "EXPONENTIAL_RETRY";
};

interface NativeConstants {
    getConstants(): Constants;
}
