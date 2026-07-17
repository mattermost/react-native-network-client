// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation

/// React-free entry point for native code outside this library (e.g. Gekidou,
/// app extensions, standalone URLSession/OkHttp usage) to resolve the outbound
/// `X-MM-Session-Attributes` header for a server.
@objc public class SessionAttributes: NSObject {
    @objc public static func getOutboundHeader(_ serverUrl: String) -> String? {
        return SessionAttributesEngine.shared.getOutboundHeader(serverUrl)
    }
}
