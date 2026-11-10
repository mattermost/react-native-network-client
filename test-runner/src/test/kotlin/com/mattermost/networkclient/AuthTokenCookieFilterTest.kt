package com.mattermost.networkclient

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.Assert.assertEquals
import org.junit.Test

class AuthTokenCookieFilterTest {

    private class RecordingJar : CookieJar {
        val stored = mutableListOf<Cookie>()
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) { stored.addAll(cookies) }
        override fun loadForRequest(url: HttpUrl): List<Cookie> = stored
    }

    private fun withoutAuthTokenCookie(delegate: CookieJar): CookieJar = object : CookieJar by delegate {
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) =
            delegate.saveFromResponse(url, cookies.filterNot { it.name == "MMAUTHTOKEN" })
    }

    @Test
    fun savingResponseThatSetsAuthTokenPersistsOnlyCsrfAndUserId() {
        val url = "https://example.com".toHttpUrl()
        val recording = RecordingJar()
        val cookies = listOf("MMAUTHTOKEN", "MMCSRF", "MMUSERID").map {
            Cookie.Builder().name(it).value("v").domain("example.com").build()
        }

        withoutAuthTokenCookie(recording).saveFromResponse(url, cookies)

        assertEquals(listOf("MMCSRF", "MMUSERID"), recording.stored.map { it.name })
    }
}
