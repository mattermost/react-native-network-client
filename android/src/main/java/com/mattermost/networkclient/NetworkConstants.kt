package com.mattermost.networkclient

import com.facebook.react.bridge.*
import java.util.HashMap

class NetworkConstants(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    fun getConstants(): Map<String, Any>? {
        val constants: MutableMap<String, Any> = HashMap<String, Any>()
        constants["EXPONENTIAL_RETRY"] = "EXPONENTIAL_RETRY"
        return constants
    }
}
