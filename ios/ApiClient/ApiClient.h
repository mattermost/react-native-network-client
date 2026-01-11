
#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

#if RCT_NEW_ARCH_ENABLED && __cplusplus
// Only import C++ headers when compiling as Objective-C++
#import <React/RCTConvert.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <NetworkClientSpec/NetworkClientSpec.h>
@interface ApiClient: RCTEventEmitter <NativeApiClientSpec>
#elif RCT_NEW_ARCH_ENABLED
// When compiling as Objective-C, just extend RCTEventEmitter
// The protocol conformance will be checked when ApiClient.mm is compiled
@interface ApiClient: RCTEventEmitter
#else
#import <React/RCTBridgeModule.h>
@interface ApiClient : RCTEventEmitter <RCTBridgeModule>
#endif

@end
