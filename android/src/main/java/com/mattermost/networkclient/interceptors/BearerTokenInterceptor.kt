package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class BearerTokenInterceptor(
        private val alias: String,
        private val bearerAuthTokenResponseHeader: String,
        private val tokenStore: TokenStore,
) : Interceptor {
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
            if (requestToken != tokenStore.retrieve(alias)) {
                tokenStore.store(requestToken, alias)
            }
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
            tokenStore.store(responseToken, alias)
        }

        return response
    }

    companion object {
        private const val BEARER_PREFIX = "Bearer "
    }
}
