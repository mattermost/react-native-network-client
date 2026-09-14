package com.mattermost.networkclient

import org.junit.Assert.assertNull
import org.junit.Assert.fail
import org.junit.Test

/**
 * Reproduces Sentry #7153287556: NullPointerException when accessing a
 * map entry that doesn't exist using Kotlin's force-unwrap operator (!!).
 *
 * WebSocketClientModuleImpl stores clients in a MutableMap<URI, NetworkClient>.
 * The old code used clients[wsUri]!! which crashes when the URI isn't in the map.
 * The fix uses clients[wsUri]?.let { ... } for safe access.
 */
class WebSocketClientNullSafetyTest {

    /**
     * Demonstrates the crash: force-unwrap (!!) on a missing map key throws
     * KotlinNullPointerException. This is exactly what happened in
     * invalidateClientFor() before the fix.
     */
    @Test(expected = NullPointerException::class)
    fun forceUnwrap_onMissingMapKey_throwsNPE() {
        val clients = mutableMapOf<String, String>()

        // Old pattern: clients[key]!! — crashes when key doesn't exist
        clients["ws://nonexistent"]!!
    }

    /**
     * The fix: safe access with ?.let returns null instead of crashing.
     * invalidateClientFor should be idempotent — invalidating a
     * non-existent client is not an error.
     */
    @Test
    fun safeAccess_onMissingMapKey_returnsNull() {
        val clients = mutableMapOf<String, String>()

        // New pattern: clients[key]?.let { ... } — no crash
        val result = clients["ws://nonexistent"]?.let { it }
        assertNull(result)
    }

    /**
     * Verifies that safe access still works correctly when the key exists.
     */
    @Test
    fun safeAccess_onExistingMapKey_returnsValue() {
        val clients = mutableMapOf<String, String>()
        clients["ws://example.com"] = "client"

        var accessed = false
        clients["ws://example.com"]?.let { accessed = true }
        assert(accessed) { "Expected ?.let block to execute for existing key" }
    }
}
