package com.mattermost.networkclient

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import java.net.URISyntaxException

class WebSocketClientModuleImplTest {
    private lateinit var impl: WebSocketClientModuleImpl
    private lateinit var promise: Promise

    @Before
    fun setUp() {
        val mockContext = mock(ReactApplicationContext::class.java)
        impl = WebSocketClientModuleImpl(mockContext)
        promise = mock(Promise::class.java)
    }

    // Happy-path binary sends require a live WebSocket connection and android.util.Base64,
    // which are only available in instrumented (on-device) tests. The base64 encoding and
    // binary frame delivery are covered end-to-end by the mattermost-mobile test suite.

    @Test
    fun `sendBinaryDataFor rejects promise for malformed URL`() {
        impl.sendBinaryDataFor("not a valid uri", "dGVzdA==", promise)

        val captor = ArgumentCaptor.forClass(Throwable::class.java)
        verify(promise).reject(captor.capture())
        assert(captor.value is URISyntaxException)
    }
}
