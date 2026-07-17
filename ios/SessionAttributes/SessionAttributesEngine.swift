// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation

@objc public class SessionAttributesEngine: NSObject {
    @objc public static let shared = SessionAttributesEngine()

    private let store = SessionAttributesStore.shared
    private let collector = SessionAttributesCollector.shared

    private override init() {}

    @objc public func setEnabled(_ serverUrl: String, enabled: Bool) {
        store.setEnabled(enabled, for: serverUrl)
    }

    @objc public func removeServer(_ serverUrl: String) {
        store.removeState(for: serverUrl)
    }

    @objc public func setManifest(_ serverUrl: String, manifestJson: String) {
        let fields = decodeArray(manifestJson).compactMap { parseField($0) }
        guard !fields.isEmpty else {
            removeServer(serverUrl)
            return
        }
        store.setManifest(fields, for: serverUrl)
    }

    @objc public func upsertManifestField(_ serverUrl: String, fieldJson: String) {
        guard let dictionary = decodeObject(fieldJson), let parsed = parseField(dictionary) else {
            return
        }
        store.upsertField(parsed, for: serverUrl)
    }

    @objc public func removeManifestField(_ serverUrl: String, name: String) {
        store.removeField(name, for: serverUrl)
    }

    @objc public func setStableValues(_ valuesJson: String) {
        guard let data = valuesJson.data(using: .utf8),
              let decoded = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return
        }
        let values = decoded.compactMapValues { value -> String? in
            if let string = value as? String {
                return string
            }
            return nil
        }
        store.setStableValues(values)
    }

    @objc public func getOutboundHeader(_ serverUrl: String) -> String? {
        guard let state = store.loadState(for: serverUrl), state.enabled, !state.manifest.isEmpty else {
            return nil
        }

        let now = Date().timeIntervalSince1970 * 1000
        let lastSentAt = state.lastSentAt
        var payload: [String: String] = [:]
        var updatedLastSentAt = lastSentAt

        for field in state.manifest {
            let lastSent = lastSentAt[field.name]
            let shouldSend = lastSent == nil || field.ttl_seconds == 0 || (now - lastSent!) >= Double(field.ttl_seconds) * 1000
            if !shouldSend {
                continue
            }

            let value = collector.collect(field.name, serverUrl: serverUrl)
            guard !value.isEmpty else {
                continue
            }

            payload[field.name] = value
            updatedLastSentAt[field.name] = now
        }

        guard !payload.isEmpty else {
            return nil
        }

        store.updateLastSentAt(updatedLastSentAt, for: serverUrl)

        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return nil
        }

        return Data(jsonString.utf8).base64EncodedString()
    }

    private func decodeArray(_ json: String) -> [[String: Any]] {
        guard let data = json.data(using: .utf8),
              let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return array
    }

    private func decodeObject(_ json: String) -> [String: Any]? {
        guard let data = json.data(using: .utf8) else {
            return nil
        }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }

    private func parseField(_ dictionary: [String: Any]) -> SAField? {
        guard let name = dictionary["name"] as? String,
              let type = dictionary["type"] as? String else {
            return nil
        }
        let ttl = dictionary["ttl_seconds"] as? Int ?? (dictionary["ttl_seconds"] as? Double).map { Int($0) } ?? 0
        let grace = dictionary["grace_period_seconds"] as? Int ?? (dictionary["grace_period_seconds"] as? Double).map { Int($0) } ?? 0
        return SAField(name: name, type: type, ttl_seconds: ttl, grace_period_seconds: grace)
    }
}
