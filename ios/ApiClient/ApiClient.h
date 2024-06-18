
#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/RCTConvert.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>

#import <NetworkClientSpec/NetworkClientSpec.h>
@interface ApiClient: RCTEventEmitter <NativeApiClientSpec>

#else

#import <React/RCTBridgeModule.h>
@interface ApiClient : RCTEventEmitter <RCTBridgeModule>

#endif

@end
