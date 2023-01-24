package com.mattermost.networkclient

import com.facebook.react.modules.network.OkHttpClientFactory
import com.mattermost.networkclient.interceptors.RCTClientRequestInterceptor
import okhttp3.OkHttpClient

class RCTOkHttpClientFactory : OkHttpClientFactory {
    companion object {
        var flipperPlugin: Object? = null
    }
    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClient()
                .newBuilder()
                .cookieJar(APIClientModule.cookieJar)
                .addInterceptor(RCTClientRequestInterceptor())
                .build()
    }
}
