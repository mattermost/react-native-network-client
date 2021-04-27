package com.mattermost.networkclient

import com.facebook.react.modules.network.OkHttpClientFactory
import com.mattermost.networkclient.interceptors.RCTClientRequestInterceptor
import com.facebook.react.modules.network.ReactCookieJarContainer;
import okhttp3.OkHttpClient

class RCTOkHttpClientFactory : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClient()
                .newBuilder()
                .cookieJar(ReactCookieJarContainer())
                .addInterceptor(RCTClientRequestInterceptor())
                .build();
    }
}
