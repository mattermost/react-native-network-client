// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import type {
    NativeModule as NM,
    EventEmitter as EE,
    EmitterSubscription as ES,
} from "react-native";

declare global {
    interface NativeModule extends NM {}
    interface EventEmitter extends EE {}
    interface EmitterSubscription extends ES {}
}
