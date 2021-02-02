package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import com.mattermost.networkclient.SessionsObject

class GlobalInterceptor() : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {

        // Get our singletons
        val clientSessions = SessionsObject.client
        var request = chain.request();
        val interceptUrl = request.url.host

        // No client session found, proceed as is
        if (clientSessions.isNullOrEmpty() || clientSessions[interceptUrl] !== null) {
            return chain.proceed(request)
        }

        // Set our client session
        var client = clientSessions[interceptUrl]!!;

        // Execute request
        return client.build().newCall(request).execute()
    }

}
