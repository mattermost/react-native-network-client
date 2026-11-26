package com.mattermost.networkclient

import com.mattermost.networkclient.helpers.CachingTokenStore
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class CachingTokenStoreTest {

    private val alias = "server-TOKEN"
    private val backing = ConcurrentHashMap<String, String>()
    private val reads = AtomicInteger()

    private fun newStore(
        read: (String) -> String? = { backing[it] },
    ) = CachingTokenStore(
        read = { alias ->
            reads.incrementAndGet()
            read(alias)
        },
        write = { value, alias -> backing[alias] = value },
        remove = { alias -> backing.remove(alias) },
    )

    @Test
    fun retrieveReadsThroughOnceThenServesFromCache() {
        backing[alias] = "persisted"
        val store = newStore()

        assertEquals("persisted", store.retrieve(alias))
        assertEquals("persisted", store.retrieve(alias))

        assertEquals(1, reads.get())
    }

    @Test
    fun retrieveOfMissingAliasReturnsNullWithoutCaching() {
        val store = newStore()

        assertNull(store.retrieve(alias))
        backing[alias] = "later"

        assertEquals("later", store.retrieve(alias))
    }

    @Test
    fun storePersistsAndRefreshesTheCache() {
        backing[alias] = "old"
        val store = newStore()
        store.retrieve(alias)

        store.store("new", alias)

        assertEquals("new", backing[alias])
        assertEquals("new", store.retrieve(alias))
        assertEquals(1, reads.get())
    }

    @Test
    fun deleteRemovesFromBackingAndCache() {
        backing[alias] = "token"
        val store = newStore()
        store.retrieve(alias)

        store.delete(alias)

        assertNull(backing[alias])
        assertNull(store.retrieve(alias))
    }

    @Test
    fun concurrentFirstRetrievesReadTheBackingStoreOnce() {
        backing[alias] = "persisted"
        val store = newStore { alias ->
            Thread.sleep(20)
            backing[alias]
        }

        runConcurrently(16) { assertEquals("persisted", store.retrieve(alias)) }

        assertEquals(1, reads.get())
    }

    @Test
    fun aSlowReadCannotOverwriteAConcurrentStore() {
        backing[alias] = "old"
        val readStarted = CountDownLatch(1)
        val releaseRead = CountDownLatch(1)
        val store = newStore { alias ->
            val value = backing[alias]
            readStarted.countDown()
            releaseRead.await(5, TimeUnit.SECONDS)
            value
        }

        val reader = Thread { store.retrieve(alias) }.apply { start() }
        readStarted.await(5, TimeUnit.SECONDS)
        val writer = Thread { store.store("new", alias) }.apply { start() }
        writer.join(100)
        releaseRead.countDown()
        reader.join()
        writer.join()

        assertEquals("new", store.retrieve(alias))
        assertEquals("new", backing[alias])
    }

    @Test
    fun aSlowReadCannotResurrectADeletedValue() {
        backing[alias] = "old"
        val readStarted = CountDownLatch(1)
        val releaseRead = CountDownLatch(1)
        val store = newStore { alias ->
            val value = backing[alias]
            readStarted.countDown()
            releaseRead.await(5, TimeUnit.SECONDS)
            value
        }

        val reader = Thread { store.retrieve(alias) }.apply { start() }
        readStarted.await(5, TimeUnit.SECONDS)
        val deleter = Thread { store.delete(alias) }.apply { start() }
        deleter.join(100)
        releaseRead.countDown()
        reader.join()
        deleter.join()

        assertNull(store.retrieve(alias))
        assertNull(backing[alias])
    }

    @Test
    fun concurrentStoresLeaveCacheAndBackingStoreInAgreement() {
        val store = newStore()
        val counter = AtomicInteger()

        runConcurrently(32, iterations = 200) {
            store.store("token-${counter.incrementAndGet()}", alias)
            store.retrieve(alias)
        }

        assertEquals(backing[alias], store.retrieve(alias))
    }

    @Test
    fun concurrentStoresAndDeletesLeaveCacheAndBackingStoreInAgreement() {
        val store = newStore()
        val counter = AtomicInteger()

        runConcurrently(32, iterations = 200) {
            val n = counter.incrementAndGet()
            if (n % 5 == 0) store.delete(alias) else store.store("token-$n", alias)
            store.retrieve(alias)
        }

        assertEquals(backing[alias], store.retrieve(alias))
    }

    private fun runConcurrently(threads: Int, iterations: Int = 1, task: () -> Unit) {
        val pool = Executors.newFixedThreadPool(threads)
        val start = CountDownLatch(1)
        val futures = (1..threads).map {
            pool.submit {
                start.await()
                repeat(iterations) { task() }
            }
        }
        start.countDown()
        try {
            futures.forEach { it.get(30, TimeUnit.SECONDS) }
        } finally {
            pool.shutdownNow()
        }
    }
}
