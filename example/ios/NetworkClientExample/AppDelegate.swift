// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        SDImageDownloadSwizzleHelper.performSwizzling()

        window = UIWindow(frame: UIScreen.main.bounds)

        factory.startReactNative(
            withModuleName: "NetworkClientExample",
            in: window,
            launchOptions: launchOptions
        )

        return true
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func bundleURL() -> URL? {
#if DEBUG
        RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
    }
}
