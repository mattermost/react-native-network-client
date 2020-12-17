// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export * from "react-native";
declare module "react-native" {
    export interface NativeModulesStatic {
        APIClient: NativeAPIClient;
        GenericClient: NativeGenericClient;
        NetworkConstants: NativeConstants;
    }
}
