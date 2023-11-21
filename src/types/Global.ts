// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import type {
    NativeModule as NM,
    EmitterSubscription as ES,
} from "react-native";

declare global {
    interface NativeModule extends NM {}
    interface EmitterSubscription extends ES {}
}
