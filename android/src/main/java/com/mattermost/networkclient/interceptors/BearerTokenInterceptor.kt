package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.SessionsObject
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class BearerTokenInterceptor(private val bearerAuthTokenResponseHeader: String) : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()
        var token = SessionsObject.data[request.url.host]?.get("AuthToken")

        // Check if there is a token already, if so - add it
        if(token !== null){
            token = SessionsObject.data[request.url.host]?.get("AuthToken") as String?
            request = request.newBuilder().addHeader("Authorization", "Bearer $token").build()
        }

        // Run our request
        val response = chain.proceed(request)

        // Save the token for future requests
        token = response.header("bearerAuthTokenResponseHeader")
        if(token !== null) {
            SessionsObject.data[request.url.host]?.set("AuthToken", token)
        }

        return response;
    }

}
