package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.NetworkClient
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import java.io.IOException

internal class RuntimeInterceptor(private val client: NetworkClient, private val type: String) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        val interceptor = getRuntimeInterceptor(request)
        if (interceptor != null) {
            return interceptor.intercept(chain)
        }

        return chain.proceed(request)
    }

    private fun getRuntimeInterceptor(request: Request): Interceptor? {
        if (type == "retry") {
            if (client.requestRetryInterceptors.containsKey(request)) {
                return client.requestRetryInterceptors[request]
            }

            return client.clientRetryInterceptor
        } else if (type == "timeout") {
            if (client.requestTimeoutInterceptors.containsKey(request)) {
                return client.requestTimeoutInterceptors[request]
            }

            return client.clientTimeoutInterceptor
        }

        return null
    }
}
