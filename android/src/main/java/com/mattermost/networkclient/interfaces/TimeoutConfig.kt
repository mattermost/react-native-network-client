package com.mattermost.networkclient.interfaces

import com.mattermost.networkclient.enums.RetryTypes

interface TimeoutConfig {
    var read: Double
    var write: Double
}
