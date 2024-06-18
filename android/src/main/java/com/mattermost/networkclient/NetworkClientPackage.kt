package com.mattermost.networkclient

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NetworkClientPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
            when (name) {
                GenericClientModuleImpl.NAME -> {
                    GenericClientModule(reactContext)
                }
                ApiClientModuleImpl.NAME -> {
                    ApiClientModule(reactContext)
                }
                WebSocketClientModuleImpl.NAME -> {
                    WebSocketClientModule(reactContext)
                }
                else -> {
                    null
                }
            }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
                GenericClientModuleImpl.NAME to ReactModuleInfo(
                        GenericClientModuleImpl.NAME,
                        GenericClientModuleImpl.NAME,
                        false,
                        false,
                        false,
                        BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                ),
                ApiClientModuleImpl.NAME to ReactModuleInfo(
                        ApiClientModuleImpl.NAME,
                        ApiClientModuleImpl.NAME,
                        false,
                        false,
                        false,
                        BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                ),
                WebSocketClientModuleImpl.NAME to ReactModuleInfo(
                        WebSocketClientModuleImpl.NAME,
                        WebSocketClientModuleImpl.NAME,
                        false,
                        false,
                        false,
                        BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                )
        )
    }
}
