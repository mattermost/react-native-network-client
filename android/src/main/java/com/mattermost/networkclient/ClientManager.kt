package com.mattermost.networkclient

import okhttp3.Call
import okhttp3.HttpUrl
import okhttp3.WebSocket

object ClientManager {
    var clients = mutableMapOf<HttpUrl, NetworkClient>()
    var calls = mutableMapOf<String, Call>()
    var sockets = mutableMapOf<String, WebSocket>()
}


