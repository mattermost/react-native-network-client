package com.mattermost.networkclient

import okhttp3.OkHttpClient
import okhttp3.Request

object SessionsObject {
    var client = mutableMapOf<String, OkHttpClient.Builder>()
    var request = mutableMapOf<String, Request.Builder>()
}
