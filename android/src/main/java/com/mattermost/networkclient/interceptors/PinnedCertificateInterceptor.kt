package com.mattermost.networkclient.interceptors

import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.tls.HandshakeCertificates
import okhttp3.tls.HeldCertificate
import java.io.IOException
import java.net.InetAddress


class PinnedCertificateInterceptor(private val pinnedCert: String, private val pinnedHost: String) : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request();
        val call = chain.call();
        val connection = chain.connection()

        return chain.proceed(request)
    }

}
