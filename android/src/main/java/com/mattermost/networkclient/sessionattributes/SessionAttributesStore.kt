package com.mattermost.networkclient.sessionattributes

import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mattermost.networkclient.helpers.KeyStoreHelper
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

data class SAField(
    val name: String,
    val type: String,
    val ttlSeconds: Int,
    val gracePeriodSeconds: Int,
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("name", name)
            put("type", type)
            put("ttl_seconds", ttlSeconds)
            put("grace_period_seconds", gracePeriodSeconds)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): SAField? {
            val name = json.optString("name", "")
            val type = json.optString("type", "")
            if (name.isEmpty() || type.isEmpty()) {
                return null
            }
            return SAField(
                name = name,
                type = type,
                ttlSeconds = json.optInt("ttl_seconds", 0),
                gracePeriodSeconds = json.optInt("grace_period_seconds", 0),
            )
        }
    }
}

data class ServerSessionAttributesState(
    var enabled: Boolean,
    var manifest: MutableList<SAField>,
    var lastSentAt: MutableMap<String, Long>,
) {
    fun snapshot(): ServerSessionAttributesState {
        return ServerSessionAttributesState(
            enabled = enabled,
            manifest = manifest.toMutableList(),
            lastSentAt = lastSentAt.toMutableMap(),
        )
    }

    fun toJson(): JSONObject {
        val manifestArray = JSONArray()
        manifest.forEach { manifestArray.put(it.toJson()) }
        val lastSent = JSONObject()
        lastSentAt.forEach { (key, value) -> lastSent.put(key, value) }
        return JSONObject().apply {
            put("enabled", enabled)
            put("manifest", manifestArray)
            put("lastSentAt", lastSent)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): ServerSessionAttributesState {
            val manifest = mutableListOf<SAField>()
            val manifestArray = json.optJSONArray("manifest")
            if (manifestArray != null) {
                for (i in 0 until manifestArray.length()) {
                    SAField.fromJson(manifestArray.getJSONObject(i))?.let { manifest.add(it) }
                }
            }
            val lastSentAt = mutableMapOf<String, Long>()
            val lastSent = json.optJSONObject("lastSentAt")
            if (lastSent != null) {
                lastSent.keys().forEach { key ->
                    lastSentAt[key] = lastSent.optLong(key)
                }
            }
            return ServerSessionAttributesState(
                enabled = json.optBoolean("enabled", false),
                manifest = manifest,
                lastSentAt = lastSentAt,
            )
        }
    }
}

private val Context.sessionAttributesDataStore: DataStore<Preferences> by preferencesDataStore(
    name = SessionAttributesStore.DATASTORE_NAME,
)

class SessionAttributesStore(context: Context) {
    private val appContext = context.applicationContext

    // Guards the in-memory caches only, so the request path never blocks on
    // DataStore reads or KeyStore crypto while the lock is held.
    private val cacheLock = Any()
    private val stateCache = mutableMapOf<String, ServerSessionAttributesState>()
    private var stableValues: Map<String, String>? = null

    // Serializes persistence so cache updates reach disk in the order they were made.
    // Only taken by persist()/delete(), which never re-enter it, so the blocking
    // DataStore write cannot deadlock.
    private val persistLock = Any()

    fun serverKey(serverUrl: String): String {
        val normalized = serverUrl.trimEnd('/')
        val digest = MessageDigest.getInstance("SHA-256").digest(normalized.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    fun loadState(serverUrl: String): ServerSessionAttributesState? {
        val state = cachedState(serverUrl) ?: return null
        return synchronized(cacheLock) { state.snapshot() }
    }

    fun saveState(serverUrl: String, state: ServerSessionAttributesState) {
        val json = synchronized(cacheLock) {
            val stored = state.snapshot()
            stateCache[serverUrl] = stored
            stored.toJson().toString()
        }
        persist(stateAlias(serverUrl), json)
    }

    fun removeState(serverUrl: String) {
        synchronized(cacheLock) {
            stateCache.remove(serverUrl)
        }
        delete(stateAlias(serverUrl))
    }

    fun setEnabled(serverUrl: String, enabled: Boolean) {
        val existing = cachedState(serverUrl)
        val json = synchronized(cacheLock) {
            val state = existing ?: ServerSessionAttributesState(false, mutableListOf(), mutableMapOf())
            state.enabled = enabled
            if (!enabled) {
                state.manifest.clear()
                state.lastSentAt.clear()
            }
            stateCache[serverUrl] = state
            state.toJson().toString()
        }
        persist(stateAlias(serverUrl), json)
    }

    fun setManifest(serverUrl: String, manifest: List<SAField>) {
        val existing = cachedState(serverUrl)
        val json = synchronized(cacheLock) {
            val state = existing ?: ServerSessionAttributesState(true, mutableListOf(), mutableMapOf())
            state.enabled = true
            state.manifest = manifest.toMutableList()
            state.lastSentAt.clear()
            stateCache[serverUrl] = state
            state.toJson().toString()
        }
        persist(stateAlias(serverUrl), json)
    }

    fun upsertField(serverUrl: String, field: SAField) {
        val state = cachedState(serverUrl)?.takeIf { it.enabled } ?: return
        val json = synchronized(cacheLock) {
            val index = state.manifest.indexOfFirst { it.name == field.name }
            if (index == -1) {
                state.manifest.add(field)
            } else {
                state.manifest[index] = field
            }
            state.lastSentAt.remove(field.name)
            state.toJson().toString()
        }
        persist(stateAlias(serverUrl), json)
    }

    fun removeField(serverUrl: String, name: String) {
        val state = cachedState(serverUrl)?.takeIf { it.enabled } ?: return
        val json = synchronized(cacheLock) {
            state.manifest.removeAll { it.name == name }
            state.lastSentAt.remove(name)
            state.toJson().toString()
        }
        persist(stateAlias(serverUrl), json)
    }

    fun setStableValues(values: Map<String, String>) {
        val json = JSONObject()
        values.forEach { (key, value) -> json.put(key, value) }
        synchronized(cacheLock) {
            stableValues = values.toMap()
        }
        persist(SessionAttributesConstants.STABLE_VALUES_ALIAS, json.toString())
    }

    fun getStableValue(name: String): String? {
        synchronized(cacheLock) {
            stableValues?.let { values -> return values[name]?.takeIf { it.isNotEmpty() } }
        }

        val restored = readStableValues()
        synchronized(cacheLock) {
            val values = stableValues ?: restored.also { stableValues = it }
            return values[name]?.takeIf { it.isNotEmpty() }
        }
    }

    private fun stateAlias(serverUrl: String): String {
        return "${SessionAttributesConstants.STORE_PREFIX}${serverKey(serverUrl)}-${SessionAttributesConstants.STATE_ALIAS_SUFFIX}"
    }

    /**
     * Returns the cached state for [serverUrl], restoring it from disk on the first
     * access. The returned instance is the cached one, so callers that mutate it must
     * do so while holding [cacheLock].
     */
    private fun cachedState(serverUrl: String): ServerSessionAttributesState? {
        synchronized(cacheLock) {
            stateCache[serverUrl]?.let { return it }
        }

        val restored = readState(serverUrl) ?: return null
        synchronized(cacheLock) {
            return stateCache.getOrPut(serverUrl) { restored }
        }
    }

    private fun readState(serverUrl: String): ServerSessionAttributesState? {
        val raw = readValue(stateAlias(serverUrl)) ?: return null
        return try {
            ServerSessionAttributesState.fromJson(JSONObject(raw))
        } catch (e: Exception) {
            Log.w("NetworkClient", "Discarding unreadable stored state: ${e.message}")
            null
        }
    }

    private fun readStableValues(): Map<String, String> {
        val raw = readValue(SessionAttributesConstants.STABLE_VALUES_ALIAS) ?: return emptyMap()
        return try {
            val json = JSONObject(raw)
            json.keys().asSequence().associateWith { json.optString(it, "") }
        } catch (e: Exception) {
            Log.w("NetworkClient", "Discarding unreadable stable values: ${e.message}")
            emptyMap()
        }
    }

    private fun readValue(alias: String): String? {
        return try {
            val encrypted = runBlocking {
                appContext.sessionAttributesDataStore.data.first()[stringPreferencesKey(alias)]
            } ?: return null
            KeyStoreHelper.decryptData(encrypted)
        } catch (e: Exception) {
            Log.w("NetworkClient", "Failed to read $alias: ${e.message}")
            null
        }
    }

    private fun persist(alias: String, value: String) = synchronized(persistLock) {
        try {
            val encrypted = KeyStoreHelper.encryptData(value)
            runBlocking {
                appContext.sessionAttributesDataStore.edit { preferences ->
                    preferences[stringPreferencesKey(alias)] = encrypted
                }
            }
        } catch (e: Exception) {
            Log.w("NetworkClient", "Failed to persist $alias: ${e.message}")
        }
    }

    private fun delete(alias: String) = synchronized(persistLock) {
        try {
            runBlocking {
                appContext.sessionAttributesDataStore.edit { preferences ->
                    preferences.remove(stringPreferencesKey(alias))
                }
            }
        } catch (e: Exception) {
            Log.w("NetworkClient", "Failed to remove $alias: ${e.message}")
        }
    }

    companion object {
        const val DATASTORE_NAME = "SessionAttributesDataStore"
    }
}
