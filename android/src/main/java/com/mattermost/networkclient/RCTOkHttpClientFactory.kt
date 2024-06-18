package com.mattermost.networkclient

import com.facebook.react.modules.network.OkHttpClientFactory
import com.mattermost.networkclient.interceptors.RCTClientRequestInterceptor
import okhttp3.OkHttpClient

class RCTOkHttpClientFactory : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClient()
                .newBuilder()
                .cookieJar(ApiClientModuleImpl.cookieJar)
                .addInterceptor(RCTClientRequestInterceptor())
                .build()
    }
}
