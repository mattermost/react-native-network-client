package com.mattermost.networkclient.metrics

import okhttp3.Call
import okhttp3.EventListener

class MetricsEventFactory : EventListener.Factory {
    private val metadataMap = mutableMapOf<Call, RequestMetadata>()

    override fun create(call: Call): EventListener {
        val metadata = RequestMetadata()
        metadataMap[call] = metadata
        return MetricsEventListener(metadata, call, this)
    }

    fun getMetadata(call: Call): RequestMetadata? = metadataMap[call]

    fun removeMetadata(call: Call) {
        metadataMap.remove(call)
    }
}
