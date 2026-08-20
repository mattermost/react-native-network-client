require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-network-client"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/mattermost/react-native-network-client.git", :tag => "#{s.version}" }
  s.prepare_command = 'ruby ios/patches/apply_patches.rb'

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # SessionAttributes lives in the sibling React-free
  # react-native-network-client-session-attributes podspec so app extensions and
  # standalone native code can link it without pulling in React, and so it resolves
  # to a single shared pod target (see that podspec for why it is not a subspec).
  # Excluded here so those files are compiled exactly once, by that pod.
  s.exclude_files = "ios/SessionAttributes/**/*"
  s.dependency 'react-native-network-client-session-attributes'

  fabric_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"

  if fabric_enabled
    s.pod_target_xcconfig    = {
      "DEFINES_MODULE" => "YES",
      "BUILD_LIBRARY_FOR_DISTRIBUTION" => "YES",
      "OTHER_CPLUSPLUSFLAGS" => "-DRCT_NEW_ARCH_ENABLED=1",
      "OTHER_SWIFT_FLAGS" => "-no-verify-emitted-module-interface"
    }
  else
    s.pod_target_xcconfig    = {
      "DEFINES_MODULE" => "YES",
      "BUILD_LIBRARY_FOR_DISTRIBUTION" => "YES",
      "OTHER_SWIFT_FLAGS" => "-no-verify-emitted-module-interface"
    }
  end

  install_modules_dependencies(s)

  s.dependency "Alamofire", "~> 5.11.2"
  s.dependency "SwiftyJSON", "~> 5.0.2"
  s.dependency "Starscream", "~> 4.0.8"
end
