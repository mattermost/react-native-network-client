package com.mattermost.networkclient.sessionattributes

import android.content.Context

/**
 * React-free entry point for native code outside this library (e.g. app
 * background handlers, standalone OkHttp usage) to resolve the outbound
 * X-MM-Session-Attributes header for a server.
 */
object SessionAttributes {
    @JvmStatic
    fun getOutboundHeader(context: Context, serverUrl: String): String? {
        return SessionAttributesEngine.getInstance(context).getOutboundHeader(serverUrl)
    }
}
