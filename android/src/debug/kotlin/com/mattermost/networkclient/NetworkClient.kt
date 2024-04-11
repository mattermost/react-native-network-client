package com.mattermost.networkclient

import com.facebook.react.bridge.*
import com.mattermost.networkclient.interceptors.*
import okhttp3.*
import java.net.URI

internal class NetworkClient(baseUrl: HttpUrl? = null, options: ReadableMap? = null, cookieJar: CookieJar? = null): NetworkClientBase(baseUrl) {
    constructor(webSocketUri: URI, baseUrl: HttpUrl, options: ReadableMap? = null) : this(baseUrl, options) {
        this.webSocketUri = webSocketUri
    }

    init {
        if (baseUrl == null) {
            applyGenericClientBuilderConfiguration()
        } else {
            applyClientBuilderConfiguration(options, cookieJar)
        }

        okHttpClient = builder.build()
    }
}
