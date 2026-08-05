package com.mattermost.networkclient.sessionattributes

import android.content.Context
import android.util.Base64
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

object SessionAttributesEngine {
    private lateinit var context: Context

    private val store: SessionAttributesStore by lazy { SessionAttributesStore(context) }
    private val collector: SessionAttributesCollector by lazy { SessionAttributesCollector(context, store) }

    fun init(appContext: Context) {
        if (!::context.isInitialized) {
            context = appContext.applicationContext
        }
    }

    fun setEnabled(serverUrl: String, enabled: Boolean) {
        store.setEnabled(serverUrl, enabled)
    }

    fun removeServer(serverUrl: String) {
        store.removeState(serverUrl)
    }

    fun setManifest(serverUrl: String, manifestJson: String) {
        val manifest = try {
            JSONArray(manifestJson)
        } catch (e: Exception) {
            Log.w("NetworkClient", "Discarding malformed manifest for $serverUrl: ${e.message}")
            null
        }
        val fields = mutableListOf<SAField>()
        if (manifest != null) {
            for (i in 0 until manifest.length()) {
                SAField.fromJson(manifest.getJSONObject(i))?.let { fields.add(it) }
            }
        }
        if (fields.isEmpty()) {
            removeServer(serverUrl)
            return
        }
        store.setManifest(serverUrl, fields)
    }

    fun upsertManifestField(serverUrl: String, fieldJson: String) {
        val field = try {
            JSONObject(fieldJson)
        } catch (e: Exception) {
            Log.w("NetworkClient", "Ignoring malformed manifest field for $serverUrl: ${e.message}")
            return
        }
        SAField.fromJson(field)?.let { store.upsertField(serverUrl, it) }
    }

    fun removeManifestField(serverUrl: String, name: String) {
        store.removeField(serverUrl, name)
    }

    fun setStableValues(valuesJson: String) {
        val json = try {
            JSONObject(valuesJson)
        } catch (e: Exception) {
            Log.w("NetworkClient", "Ignoring malformed stable values: ${e.message}")
            return
        }
        val values = mutableMapOf<String, String>()
        json.keys().forEach { key ->
            values[key] = json.optString(key, "")
        }
        store.setStableValues(values)
    }

    fun getOutboundHeader(serverUrl: String): String? {
        if (!::context.isInitialized) {
            Log.w("NetworkClient", "Session attributes requested before init")
            return null
        }

        val state = store.loadState(serverUrl) ?: return null
        if (!state.enabled || state.manifest.isEmpty()) {
            return null
        }

        val now = System.currentTimeMillis()
        val payload = JSONObject()

        for (field in state.manifest) {
            val lastSent = state.lastSentAt[field.name]
            val shouldSend = lastSent == null || field.ttlSeconds == 0 ||
                (now - lastSent) >= field.ttlSeconds * 1000L
            if (!shouldSend) {
                continue
            }

            val value = collector.collect(field.name, serverUrl)
            if (value.isEmpty()) {
                continue
            }

            payload.put(field.name, value)
            state.lastSentAt[field.name] = now
        }

        if (payload.length() == 0) {
            return null
        }

        store.saveState(serverUrl, state)

        return Base64.encodeToString(payload.toString().toByteArray(), Base64.NO_WRAP)
    }
}
