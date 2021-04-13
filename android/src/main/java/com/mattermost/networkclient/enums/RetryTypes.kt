package com.mattermost.networkclient.enums

enum class RetryTypes(val type: String) {
    LINEAR_RETRY("linear"),
    EXPONENTIAL_RETRY("exponential"),
}
