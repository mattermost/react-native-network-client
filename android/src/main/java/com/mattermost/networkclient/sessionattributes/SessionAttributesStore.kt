package com.mattermost.networkclient.sessionattributes

import android.content.Context
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
    private val lock = Any()

    fun serverKey(serverUrl: String): String {
        val normalized = serverUrl.trimEnd('/')
        val digest = MessageDigest.getInstance("SHA-256").digest(normalized.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun stateAlias(serverUrl: String): String {
        return "${SessionAttributesConstants.STORE_PREFIX}${serverKey(serverUrl)}-${SessionAttributesConstants.STATE_ALIAS_SUFFIX}"
    }

    private fun readValue(alias: String): String? {
        val encrypted = runBlocking {
            appContext.sessionAttributesDataStore.data.first()[stringPreferencesKey(alias)]
        } ?: return null
        return try {
            KeyStoreHelper.decryptData(encrypted)
        } catch (_: Exception) {
            null
        }
    }

    private fun writeValue(alias: String, value: String) {
        val encrypted = KeyStoreHelper.encryptData(value)
        runBlocking {
            appContext.sessionAttributesDataStore.edit { preferences ->
                preferences[stringPreferencesKey(alias)] = encrypted
            }
        }
    }

    private fun deleteValue(alias: String) {
        runBlocking {
            appContext.sessionAttributesDataStore.edit { preferences ->
                preferences.remove(stringPreferencesKey(alias))
            }
        }
    }

    fun loadState(serverUrl: String): ServerSessionAttributesState? = synchronized(lock) {
        val raw = readValue(stateAlias(serverUrl)) ?: return null
        return try {
            ServerSessionAttributesState.fromJson(JSONObject(raw))
        } catch (_: Exception) {
            null
        }
    }

    fun saveState(serverUrl: String, state: ServerSessionAttributesState) = synchronized(lock) {
        writeValue(stateAlias(serverUrl), state.toJson().toString())
    }

    fun removeState(serverUrl: String) = synchronized(lock) {
        deleteValue(stateAlias(serverUrl))
    }

    fun setEnabled(serverUrl: String, enabled: Boolean) = synchronized(lock) {
        val state = loadStateLocked(serverUrl) ?: ServerSessionAttributesState(false, mutableListOf(), mutableMapOf())
        state.enabled = enabled
        if (!enabled) {
            state.manifest.clear()
            state.lastSentAt.clear()
        }
        writeValue(stateAlias(serverUrl), state.toJson().toString())
    }

    fun setManifest(serverUrl: String, manifest: List<SAField>) = synchronized(lock) {
        val state = loadStateLocked(serverUrl) ?: ServerSessionAttributesState(true, mutableListOf(), mutableMapOf())
        state.enabled = true
        state.manifest = manifest.toMutableList()
        state.lastSentAt.clear()
        writeValue(stateAlias(serverUrl), state.toJson().toString())
    }

    fun upsertField(serverUrl: String, field: SAField) = synchronized(lock) {
        val state = loadStateLocked(serverUrl)?.takeIf { it.enabled } ?: return
        val index = state.manifest.indexOfFirst { it.name == field.name }
        if (index == -1) {
            state.manifest.add(field)
        } else {
            state.manifest[index] = field
        }
        state.lastSentAt.remove(field.name)
        writeValue(stateAlias(serverUrl), state.toJson().toString())
    }

    fun removeField(serverUrl: String, name: String) = synchronized(lock) {
        val state = loadStateLocked(serverUrl)?.takeIf { it.enabled } ?: return
        state.manifest.removeAll { it.name == name }
        state.lastSentAt.remove(name)
        writeValue(stateAlias(serverUrl), state.toJson().toString())
    }

    fun setStableValues(values: Map<String, String>) = synchronized(lock) {
        val json = JSONObject()
        values.forEach { (key, value) -> json.put(key, value) }
        writeValue(SessionAttributesConstants.STABLE_VALUES_ALIAS, json.toString())
    }

    fun getStableValue(name: String): String? = synchronized(lock) {
        val raw = readValue(SessionAttributesConstants.STABLE_VALUES_ALIAS) ?: return null
        return try {
            val value = JSONObject(raw).optString(name, "")
            if (value.isEmpty()) null else value
        } catch (_: Exception) {
            null
        }
    }

    private fun loadStateLocked(serverUrl: String): ServerSessionAttributesState? {
        val raw = readValue(stateAlias(serverUrl)) ?: return null
        return try {
            ServerSessionAttributesState.fromJson(JSONObject(raw))
        } catch (_: Exception) {
            null
        }
    }

    companion object {
        const val DATASTORE_NAME = "SessionAttributesDataStore"
    }
}
