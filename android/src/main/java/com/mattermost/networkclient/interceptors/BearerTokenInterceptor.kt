package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class BearerTokenInterceptor(
        private val alias: String,
        private val bearerAuthTokenResponseHeader: String,
        private val tokenStore: TokenStore,
) : Interceptor {
    private val lock = Any()

    @Volatile
    private var invalidated = false

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()

        val requestToken = request.header("Authorization")
                ?.takeIf { it.startsWith(BEARER_PREFIX, ignoreCase = true) }
                ?.substring(BEARER_PREFIX.length)
                ?.trim()
                ?.takeIf { it.isNotEmpty() }

        if (requestToken != null) {
            // Sessions that never return the token header (e.g. SSO) are only known to the
            // caller. Keep its token so native-only requests, like push receipts, can use it.
            persist(requestToken)
        } else {
            val storedToken = tokenStore.retrieve(alias)
            if (storedToken != null) {
                request = request.newBuilder()
                        .header("Authorization", "$BEARER_PREFIX$storedToken")
                        .build()
            }
        }

        val response = chain.proceed(request)
        val responseToken = response.headers[bearerAuthTokenResponseHeader]
        if (responseToken != null) {
            persist(responseToken)
        }

        return response
    }

    fun invalidate() {
        synchronized(lock) {
            invalidated = true
            tokenStore.delete(alias)
        }
    }

    private fun persist(token: String) {
        if (invalidated || token == tokenStore.retrieve(alias)) {
            return
        }

        synchronized(lock) {
            if (!invalidated && token != tokenStore.retrieve(alias)) {
                tokenStore.store(token, alias)
            }
        }
    }

    companion object {
        private const val BEARER_PREFIX = "Bearer "
    }
}
