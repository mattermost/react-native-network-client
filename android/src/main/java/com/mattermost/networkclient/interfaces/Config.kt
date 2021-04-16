package com.mattermost.networkclient.interfaces

interface Config: MutableMap<String, String> {
    val RetryConfig: RetryConfig
}

// SessionsObject.config[url].retryConfig: RetryConfig
// SessionsObject.config[url].headers: Headers

