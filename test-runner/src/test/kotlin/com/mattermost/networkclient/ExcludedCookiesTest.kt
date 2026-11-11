package com.mattermost.networkclient

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.Assert.assertEquals
import org.junit.Test

class ExcludedCookiesTest {

    private class RecordingJar : CookieJar {
        val stored = mutableListOf<Cookie>()
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) { stored.addAll(cookies) }
        override fun loadForRequest(url: HttpUrl): List<Cookie> = stored
    }

    private fun excluding(names: Set<String>, delegate: CookieJar): CookieJar = object : CookieJar by delegate {
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) =
            delegate.saveFromResponse(url, cookies.filterNot { it.name in names })
    }

    @Test
    fun savingResponseDropsOnlyCookiesNamedInExcludedCookies() {
        val url = "https://example.com".toHttpUrl()
        val recording = RecordingJar()
        val cookies = listOf("excluded", "kept1", "kept2").map {
            Cookie.Builder().name(it).value("v").domain("example.com").build()
        }

        excluding(setOf("excluded"), recording).saveFromResponse(url, cookies)

        assertEquals(listOf("kept1", "kept2"), recording.stored.map { it.name })
    }
}
