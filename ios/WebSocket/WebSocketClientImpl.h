#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

#if RCT_NEW_ARCH_ENABLED

#import <NetworkClientSpec/NetworkClientSpec.h>
@interface WebSocketClientImpl: RCTEventEmitter <NativeWebSocketClientSpec>

#else

#import <React/RCTBridgeModule.h>
@interface WebSocketClientImpl : RCTEventEmitter <RCTBridgeModule>

#endif

@end
