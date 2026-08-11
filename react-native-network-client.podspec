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

  # SessionAttributes lives in its own React-free subspec so it can be linked by
  # app extensions / standalone native code without pulling in React.
  s.subspec 'SessionAttributes' do |sa|
    sa.source_files = 'ios/SessionAttributes/**/*.swift'
    sa.pod_target_xcconfig = { 'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES' }
  end

  s.subspec 'Core' do |core|
    core.source_files = "ios/**/*.{h,m,mm,swift}"
    core.exclude_files = "ios/SessionAttributes/**/*"
    core.dependency 'react-native-network-client/SessionAttributes'

    fabric_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"

    if fabric_enabled
      core.pod_target_xcconfig    = {
        "DEFINES_MODULE" => "YES",
        "BUILD_LIBRARY_FOR_DISTRIBUTION" => "YES",
        "OTHER_CPLUSPLUSFLAGS" => "-DRCT_NEW_ARCH_ENABLED=1",
        "OTHER_SWIFT_FLAGS" => "-no-verify-emitted-module-interface"
      }
    else
      core.pod_target_xcconfig    = {
        "DEFINES_MODULE" => "YES",
        "BUILD_LIBRARY_FOR_DISTRIBUTION" => "YES",
        "OTHER_SWIFT_FLAGS" => "-no-verify-emitted-module-interface"
      }
    end

    install_modules_dependencies(core)

    core.dependency "Alamofire", "~> 5.11.2"
    core.dependency "SwiftyJSON", "~> 5.0.2"
    core.dependency "Starscream", "~> 4.0.8"
  end

  s.default_subspec = 'Core'
end
