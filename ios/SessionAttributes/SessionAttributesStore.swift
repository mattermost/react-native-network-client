// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation
import CryptoKit

struct SAField: Codable, Equatable {
    let name: String
    let type: String
    let ttl_seconds: Int
    let grace_period_seconds: Int
}

struct ServerSessionAttributesState: Codable {
    var enabled: Bool
    var manifest: [SAField]
    var lastSentAt: [String: Double]
}

public class SessionAttributesStore {
    public static let shared = SessionAttributesStore()

    private let userDefaults: UserDefaults?
    private let queue = DispatchQueue(label: "com.mattermost.networkclient.sessionattributes.store")
    // States are stored under a hash of the server URL, so the URLs of the servers enabled
    // in this process are kept here to reset them on a network change.
    private var enabledServers = Set<String>()
    // Bumped on every network change, see markSent.
    private var networkGeneration = 0

    private init() {
        let appGroupId = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as? String
        userDefaults = appGroupId != nil ? UserDefaults(suiteName: appGroupId) : UserDefaults.standard
    }

    func serverKey(_ serverUrl: String) -> String {
        let normalized = serverUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let digest = SHA256.hash(data: Data(normalized.utf8))
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }

    private func stateKey(for serverUrl: String) -> String {
        return "\(SessionAttributesConstants.storePrefix)state_\(serverKey(serverUrl))"
    }

    private func readState(for serverUrl: String) -> ServerSessionAttributesState? {
        guard let data = userDefaults?.object(forKey: stateKey(for: serverUrl)) as? Data else {
            return nil
        }
        return try? JSONDecoder().decode(ServerSessionAttributesState.self, from: data)
    }

    private func writeState(_ state: ServerSessionAttributesState, for serverUrl: String) {
        guard let data = try? JSONEncoder().encode(state) else {
            return
        }
        userDefaults?.set(data, forKey: stateKey(for: serverUrl))
    }

    func loadState(for serverUrl: String) -> ServerSessionAttributesState? {
        queue.sync {
            readState(for: serverUrl)
        }
    }

    func saveState(_ state: ServerSessionAttributesState, for serverUrl: String) {
        queue.sync {
            writeState(state, for: serverUrl)
        }
    }

    func removeState(for serverUrl: String) {
        queue.sync {
            enabledServers.remove(serverUrl)
            userDefaults?.removeObject(forKey: stateKey(for: serverUrl))
        }
    }

    func setEnabled(_ enabled: Bool, for serverUrl: String) {
        queue.sync {
            var state = readState(for: serverUrl) ?? ServerSessionAttributesState(enabled: false, manifest: [], lastSentAt: [:])
            state.enabled = enabled
            if enabled {
                enabledServers.insert(serverUrl)
            } else {
                enabledServers.remove(serverUrl)
                state.manifest = []
                state.lastSentAt = [:]
            }
            writeState(state, for: serverUrl)
        }
    }

    func setManifest(_ manifest: [SAField], for serverUrl: String) {
        queue.sync {
            var state = readState(for: serverUrl) ?? ServerSessionAttributesState(enabled: true, manifest: [], lastSentAt: [:])
            state.enabled = true
            state.manifest = manifest
            state.lastSentAt = [:]
            enabledServers.insert(serverUrl)
            writeState(state, for: serverUrl)
        }
    }

    func upsertField(_ field: SAField, for serverUrl: String) {
        queue.sync {
            guard var state = readState(for: serverUrl), state.enabled else {
                return
            }
            if let index = state.manifest.firstIndex(where: { $0.name == field.name }) {
                state.manifest[index] = field
            } else {
                state.manifest.append(field)
            }
            state.lastSentAt.removeValue(forKey: field.name)
            writeState(state, for: serverUrl)
        }
    }

    func removeField(_ name: String, for serverUrl: String) {
        queue.sync {
            guard var state = readState(for: serverUrl), state.enabled else {
                return
            }
            state.manifest.removeAll { $0.name == name }
            state.lastSentAt.removeValue(forKey: name)
            writeState(state, for: serverUrl)
        }
    }

    /**
     Records `names` as sent at `sentAt`. A header built before the network changed
     (`generation` is stale) carried the old network values, so those keys stay unsent
     and go out again on the next request.
     */
    func markSent(_ names: [String], at sentAt: Double, generation: Int, for serverUrl: String) {
        queue.sync {
            guard var state = readState(for: serverUrl), state.enabled else {
                return
            }
            let staleNetwork = generation != networkGeneration
            for name in names where !staleNetwork || !SessionAttributesConstants.networkKeys.contains(name) {
                state.lastSentAt[name] = sentAt
            }
            writeState(state, for: serverUrl)
        }
    }

    func currentNetworkGeneration() -> Int {
        queue.sync {
            networkGeneration
        }
    }

    /**
     Clears the network attributes' sent time on every enabled server, so the next request
     carries the new network values whatever their ttl. Returns the URLs of those servers.
     */
    func resetNetworkFields() -> [String] {
        queue.sync {
            networkGeneration += 1
            var serverUrls: [String] = []
            for serverUrl in enabledServers {
                guard var state = readState(for: serverUrl), state.enabled else {
                    continue
                }
                for key in SessionAttributesConstants.networkKeys {
                    state.lastSentAt.removeValue(forKey: key)
                }
                writeState(state, for: serverUrl)
                serverUrls.append(serverUrl)
            }
            return serverUrls
        }
    }

    func setStableValues(_ values: [String: String]) {
        queue.sync {
            guard let data = try? JSONEncoder().encode(values) else {
                return
            }
            userDefaults?.set(data, forKey: SessionAttributesConstants.stableValuesKey)
        }
    }

    func getStableValue(_ name: String) -> String? {
        queue.sync {
            guard let data = userDefaults?.object(forKey: SessionAttributesConstants.stableValuesKey) as? Data,
                  let values = try? JSONDecoder().decode([String: String].self, from: data) else {
                return nil
            }
            return values[name]
        }
    }
}
