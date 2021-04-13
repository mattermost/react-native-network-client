package com.mattermost.networkclient.interfaces

import com.mattermost.networkclient.enums.RetryTypes

interface RetryConfig {
    val retryType: RetryTypes
    val retryLimit: Double
    val retryInterval: Double
    val retryExponentialBackOffBase: Double
    val retryExponentialBackOffScale: Double
    val retryStatusCodes: Set<Int>
    val retryMethods: Set<String>
}
