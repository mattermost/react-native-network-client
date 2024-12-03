package com.mattermost.networkclient.metrics

import okhttp3.Call
import okhttp3.EventListener
import okhttp3.Handshake
import okhttp3.Protocol
import okhttp3.Response
import java.io.IOException
import java.net.InetSocketAddress
import java.net.Proxy

class MetricsEventListener(
    private val requestMetadata: RequestMetadata,
    private val call: Call,
    private val factory: MetricsEventFactory,
): EventListener() {

    override fun callStart(call: Call) {
        super.callStart(call)
        requestMetadata.callStartNanos = System.nanoTime()
    }

    override fun connectStart(call: Call, inetSocketAddress: InetSocketAddress, proxy: Proxy) {
        super.connectStart(call, inetSocketAddress, proxy)
        requestMetadata.connectStartNanos = System.nanoTime()
    }

    override fun connectEnd(
        call: Call,
        inetSocketAddress: InetSocketAddress,
        proxy: Proxy,
        protocol: Protocol?
    ) {
        super.connectEnd(call, inetSocketAddress, proxy, protocol)
        requestMetadata.connectEndNanos = System.nanoTime()
        requestMetadata.httpVersion = protocol?.toString() ?: "Unknown"
    }

    override fun secureConnectEnd(call: Call, handshake: Handshake?) {
        super.secureConnectEnd(call, handshake)
        if (handshake != null) {
            requestMetadata.sslVersion = handshake.tlsVersion.javaName
            requestMetadata.sslCipher = handshake.cipherSuite.javaName
        }
    }

    override fun responseHeadersStart(call: Call) {
        super.responseHeadersStart(call)
        requestMetadata.responseStartNanos = System.nanoTime()
    }

    override fun responseHeadersEnd(call: Call, response: Response) {
        super.responseHeadersEnd(call, response)
        requestMetadata.isCached = response.cacheResponse != null

        val handshake = response.handshake
        if (requestMetadata.sslVersion == null && handshake != null) {
            requestMetadata.sslVersion = handshake.tlsVersion?.javaName
            requestMetadata.sslCipher = handshake.cipherSuite?.javaName
        }

        if (requestMetadata.httpVersion == null) {
            requestMetadata.httpVersion = response.protocol.toString()
        }
    }

    override fun callFailed(call: Call, ioe: IOException) {
        super.callFailed(call, ioe)
    }

    override fun canceled(call: Call) {
        super.canceled(call)
        factory.removeMetadata(call)
    }
}
