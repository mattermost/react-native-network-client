require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# Standalone, React-free pod for the SessionAttributes sources.
#
# This is a sibling ROOT spec rather than a subspec of react-native-network-client
# on purpose. As a subspec it shared the root spec's module name, so the two pod
# targets CocoaPods generates (the app links it via the `Core` default subspec,
# while the notification/share extensions link it alone) both produced
# react_native_network_client.framework. Regular builds gave each pod target its
# own CONFIGURATION_BUILD_DIR and never collided, but archiving redirects products
# into a single shared directory, where the duplicate product broke the build with
# "Multiple commands produce ... react_native_network_client.framework".
#
# A root spec owns its own module name, so it is built once and shared by the app
# and both extensions. CocoaPods rejects `module_name` on a subspec, which is why
# the collision cannot be fixed in place.
#
# The sources here depend only on system frameworks (Foundation, Network,
# NetworkExtension, SystemConfiguration, CryptoKit), which is what makes them
# safe to link into app extensions.
#
# Swift module name is react_native_network_client_session_attributes (CocoaPods
# replaces the hyphens in the pod name with underscores).
Pod::Spec.new do |s|
  s.name         = "react-native-network-client-session-attributes"
  s.version      = package["version"]
  s.summary      = "React-free session attributes collection for Mattermost clients"
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/mattermost/react-native-network-client.git", :tag => "#{s.version}" }

  s.source_files = "ios/SessionAttributes/**/*.swift"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "BUILD_LIBRARY_FOR_DISTRIBUTION" => "YES",
    "OTHER_SWIFT_FLAGS" => "-no-verify-emitted-module-interface"
  }
end
