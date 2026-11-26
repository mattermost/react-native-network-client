package com.mattermost.networkclient.helpers

import com.mattermost.networkclient.interceptors.TokenStore
import java.util.concurrent.ConcurrentHashMap

class CachingTokenStore(
        private val read: (alias: String) -> String?,
        private val write: (value: String, alias: String) -> Unit,
        private val remove: (alias: String) -> Unit,
) : TokenStore {
    private val cache = ConcurrentHashMap<String, String>()
    private val lock = Any()

    override fun retrieve(alias: String): String? {
        cache[alias]?.let { return it }

        return synchronized(lock) {
            cache[alias] ?: read(alias)?.also { cache[alias] = it }
        }
    }

    override fun store(value: String, alias: String) {
        synchronized(lock) {
            write(value, alias)
            cache[alias] = value
        }
    }

    override fun delete(alias: String) {
        synchronized(lock) {
            remove(alias)
            cache.remove(alias)
        }
    }
}
