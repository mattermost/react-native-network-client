package com.mattermost.networkclient.interfaces

interface Config: MutableMap<String, String> {
    val RetryConfig: RetryConfig
}
