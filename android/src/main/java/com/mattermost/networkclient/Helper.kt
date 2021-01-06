package com.mattermost.networkclient

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import okhttp3.Response

fun Response.returnAsWriteableMap (): WritableMap {
    val headers = Arguments.createMap();
    this.headers.forEach{ k -> headers.putString(k.first, k.second) }

    val map = Arguments.createMap()
    map.putMap("headers", headers)
    map.putString("data", this.body!!.string())
    map.putInt("code", this.code)
    map.putBoolean("ok", this.isSuccessful)
    return map;
}

fun Response.handleViaPromise(promise: Promise){
    return if(this.isSuccessful){
        promise.resolve(this.returnAsWriteableMap());
    } else {
        promise.reject(this.code.toString(), this.returnAsWriteableMap())
    }
}
