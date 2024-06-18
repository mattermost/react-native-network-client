package com.mattermost.networkclient

import com.facebook.fbreact.specs.NativeGenericClientSpec
import com.facebook.react.bridge.*
import java.lang.Exception

internal class GenericClientModule(reactContext: ReactApplicationContext) : NativeGenericClientSpec(reactContext) {
    private var implementation: GenericClientModuleImpl = GenericClientModuleImpl(reactContext)

    override fun getName(): String = GenericClientModuleImpl.NAME

    override fun head(url: String?, options: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("invalid HEAD request"))
            return
        }
        implementation.head(url, options, promise)
    }

    override fun get(url: String?, options: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("invalid GET request"))
            return
        }
        implementation.get(url, options, promise)
    }

    override fun put(url: String?, options: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("invalid PUT request"))
            return
        }
        implementation.put(url, options, promise)
    }

    override fun post(url: String?, options: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("invalid POST request"))
            return
        }
        implementation.post(url, options, promise)
    }

    override fun patch(url: String?, options: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("invalid PATCH request"))
            return
        }
        implementation.patch(url, options, promise)
    }

    override fun methodDelete(url: String?, options: ReadableMap?, promise: Promise?) {
        if (url.isNullOrEmpty() || promise == null) {
            promise?.reject(Exception("invalid DELETE request"))
            return
        }
        implementation.delete(url, options, promise)
    }


}
