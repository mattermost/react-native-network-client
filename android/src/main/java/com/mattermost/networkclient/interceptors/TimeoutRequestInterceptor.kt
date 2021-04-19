package com.mattermost.networkclient.interceptors

import com.mattermost.networkclient.SessionsObject
import com.mattermost.networkclient.interfaces.RetryConfig
import com.mattermost.networkclient.interfaces.TimeoutConfig
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

class TimeoutRequestInterceptor(private var baseUrl: String) : Interceptor {

    private fun getTimeoutConfig(): TimeoutConfig {;
        val config: TimeoutConfig;

        // Check for request options
        if (SessionsObject.requestConfig[baseUrl]?.containsKey("requestTimeout") == true) {
            config = SessionsObject.requestConfig[baseUrl]!!["requestTimeout"] as TimeoutConfig;
            // Remove once set
            SessionsObject.requestConfig[baseUrl]!!.remove("requestTimeout");
        } else if (SessionsObject.requestConfig[baseUrl]?.containsKey("clientTimeout") == true) {
            // Else check for client options
            config = SessionsObject.requestConfig[baseUrl]!!["clientTimeout"] as TimeoutConfig
        } else {
            // Else use defaults
            config = SessionsObject.DefaultTimeout
        }

        return config;
    }

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();
        val config = getTimeoutConfig();

        // Make a new chain; time out should be per-request
        val newChain = chain.withConnectTimeout(config.read.toInt(), TimeUnit.MILLISECONDS).withReadTimeout(config.read.toInt(), TimeUnit.MILLISECONDS).withWriteTimeout(config.write.toInt(), TimeUnit.MILLISECONDS)
        return newChain.proceed(request)
    }

}
