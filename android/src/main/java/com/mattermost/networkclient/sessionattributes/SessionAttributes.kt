package com.mattermost.networkclient.sessionattributes

import android.content.Context

/**
 * React-free entry point for native code outside this library (e.g. app
 * background handlers, standalone OkHttp usage) to resolve the outbound
 * X-MM-Session-Attributes header for a server.
 *
 * Callers that reach this outside the React module (e.g. WorkManager jobs) must
 * call [init] from their Application.onCreate, which runs before any component
 * in the process.
 */
object SessionAttributes {
    @JvmStatic
    fun init(context: Context) {
        SessionAttributesEngine.init(context)
    }

    @JvmStatic
    fun getOutboundHeader(serverUrl: String): String? {
        return SessionAttributesEngine.getOutboundHeader(serverUrl)
    }
}
