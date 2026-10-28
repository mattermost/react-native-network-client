// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation

@objc public class SessionAttributesEngine: NSObject {
    @objc public static let shared = SessionAttributesEngine()

    private let store = SessionAttributesStore.shared
    private let collector = SessionAttributesCollector.shared

    // The OS reports several updates for a single network switch, so the network is
    // compared once it has settled. Only touched on networkQueue.
    private static let networkChangeDebounce: TimeInterval = 1
    private let networkQueue = DispatchQueue(label: "com.mattermost.networkclient.sessionattributes.networkchange")
    private var pendingNetworkEvaluation: DispatchWorkItem?
    private var lastNetworkSnapshot: NetworkSnapshot?

    private override init() {
        super.init()
        // Only the app relays network changes to JS, extensions just attach the header.
        guard Bundle.main.bundleURL.pathExtension != "appex" else {
            return
        }
        collector.setNetworkUpdateHandler { [weak self] in
            self?.scheduleNetworkEvaluation()
        }
    }

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
        // Read before collecting, so a network change during collection is detected in markSent.
        let generation = store.currentNetworkGeneration()
        guard let state = store.loadState(for: serverUrl), state.enabled, !state.manifest.isEmpty else {
            return nil
        }

        let now = Date().timeIntervalSince1970 * 1000
        let lastSentAt = state.lastSentAt
        var payload: [String: String] = [:]

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
        }

        guard !payload.isEmpty else {
            return nil
        }

        store.markSent(Array(payload.keys), at: now, generation: generation, for: serverUrl)

        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return nil
        }

        return Data(jsonString.utf8).base64EncodedString()
    }

    private func scheduleNetworkEvaluation() {
        networkQueue.async {
            self.pendingNetworkEvaluation?.cancel()
            let evaluation = DispatchWorkItem { [weak self] in
                self?.evaluateNetworkChange()
            }
            self.pendingNetworkEvaluation = evaluation
            self.networkQueue.asyncAfter(deadline: .now() + Self.networkChangeDebounce, execute: evaluation)
        }
    }

    /**
     Compares the network with the last one seen and, when it changed, resets the network
     attributes of every enabled server before posting `networkChangedNotification`. The
     first reading is only a baseline, and a reading without a network is ignored so a drop
     and reconnect to the same network does not count as a change. Runs on networkQueue.
     */
    private func evaluateNetworkChange() {
        let snapshot = collector.currentNetworkSnapshot()
        guard !snapshot.interfaceType.isEmpty else {
            return
        }
        let previous = lastNetworkSnapshot
        lastNetworkSnapshot = snapshot
        guard let previous, previous != snapshot else {
            return
        }

        let serverUrls = store.resetNetworkFields()
        guard !serverUrls.isEmpty else {
            return
        }
        NotificationCenter.default.post(
            name: SessionAttributesConstants.networkChangedNotification,
            object: nil,
            userInfo: ["serverUrls": serverUrls]
        )
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
