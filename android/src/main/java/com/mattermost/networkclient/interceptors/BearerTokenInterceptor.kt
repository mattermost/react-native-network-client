package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.ApiClientModuleImpl
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class BearerTokenInterceptor(private val alias: String, private val bearerAuthTokenResponseHeader: String) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()

        var token = ApiClientModuleImpl.retrieveValue(alias)
        if (token !== null) {
            request = request.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
        }

        val response = chain.proceed(request)
        token = response.headers[bearerAuthTokenResponseHeader]
        if (token != null) {
            ApiClientModuleImpl.storeValue(token, alias)
        }

        return response
    }
}
