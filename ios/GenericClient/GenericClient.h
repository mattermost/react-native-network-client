#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

#if RCT_NEW_ARCH_ENABLED

#import <React/RCTConvert.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>

#import <NetworkClientSpec/NetworkClientSpec.h>
@interface GenericClient: NSObject <NativeGenericClientSpec>

#else

#import <React/RCTBridgeModule.h>
@interface GenericClient : NSObject <RCTBridgeModule>

#endif

@end

