// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation

public struct SessionAttributesConstants {
    public static let headerName = "X-MM-Session-Attributes"
    public static let storePrefix = "sa_"
    public static let stableValuesKey = "sa_stable_values"
    public static let managedConfigKey = "com.apple.configuration.managed"
    public static let isDeviceManagedKey = "isDeviceManaged"
    public static let isSupervisedKey = "isSupervised"

    public struct AttributeKey {
        public static let vpnActive = "vpn_active"
        public static let clientDeviceId = "client_device_id"
        public static let clientIpAddress = "client_ip_address"
        public static let clientVersion = "client_version"
        public static let jailbreakDetected = "jailbreak_detected"
        public static let mdmEnrolled = "mdm_enrolled"
        public static let networkInterfaceType = "network_interface_type"
        public static let osPlatform = "os_platform"
        public static let osVersion = "os_version"
        public static let serverFqdn = "server_fqdn"
        public static let ssid = "ssid"
    }

    // Attributes read from the device network, resent as soon as the network changes.
    public static let networkKeys: Set<String> = [
        AttributeKey.clientIpAddress,
        AttributeKey.networkInterfaceType,
        AttributeKey.ssid,
        AttributeKey.vpnActive,
    ]

    // Posted with the reset servers' URLs in userInfo["serverUrls"] when the device network changes.
    public static let networkChangedNotification = Notification.Name("ApiClient-SessionAttributesNetworkChanged")
}
