#import "WebSocketClientImpl.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "NetworkClientSpec.h"
#endif

#if __has_include("react_native_network_client-Swift.h")
#import <react_native_network_client-Swift.h>
#else
#import <react_native_network_client/react_native_network_client-Swift.h>
#endif

@interface WebSocketClientImpl () <WebSocketClientDelegate>
@end

@implementation WebSocketClientImpl {
    WebSocketWrapper *wrapper;
}

-(instancetype) init {
    self = [super init];
    if (self) {
        wrapper = [WebSocketWrapper new];
        wrapper.delegate = self;
        [wrapper captureEvents];
    }
    
    return self;
}

RCT_EXPORT_MODULE(WebSocketClient)

RCT_REMAP_METHOD(ensureClientFor, url:(NSString *)url
                 withOptions:(NSDictionary *)options
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper ensureClientForUrlString:url options:options resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(connectFor, url:(NSString *)url withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper connectForUrlString:url resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(createClientFor:(NSString *)url
                 withOptions:(NSDictionary *)options
                 withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper createClientForUrlString:url options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(disconnectFor:(NSString *)url withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper disconnectForUrlString:url resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(sendDataFor:(NSString *)url withData:(NSString *)data withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper sendDataForUrlString:url data:data resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(invalidateClientFor:(NSString *)url withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper invalidateClientForUrlString:url resolve:resolve reject:reject];
}


#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeWebSocketClientSpecJSI>(params);
}
#endif


#pragma protocol

- (void)sendEventWithName:(NSString * _Nonnull)name result:(NSDictionary<NSString *,id> * _Nullable)result {
    [self sendEventWithName:name body:result];
}

- (NSArray<NSString *> *)supportedEvents {
  return [WebSocketWrapper supportedEvents];
}

#pragma overrides
+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)invalidate {
    [super invalidate];
    [wrapper invalidate];
}

#pragma utils
#ifdef RCT_NEW_ARCH_ENABLED
- (NSNumber *)processBooleanValue:(std::optional<bool>)optionalBoolValue {
    // Use the boolean value
    if (optionalBoolValue.has_value()) {
        return [NSNumber numberWithBool:optionalBoolValue.value()];
    }

    return 0;
}

- (NSDictionary *) convertConfigurationToDictionary: (JS::NativeWebSocketClient::WebSocketClientConfiguration &)config {
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    dict[@"headers"] = config.headers();
    if (config.timeoutInterval().has_value()) {
        dict[@"timeoutInterval"] = @(config.timeoutInterval().value());
    }
    if (config.clientP12Configuration().has_value()) {
        NSMutableDictionary *cert = [[NSMutableDictionary alloc] init];
        JS::NativeWebSocketClient::ClientP12Configuration p12 = config.clientP12Configuration().value();
        cert[@"path"] = p12.path();
        cert[@"password"] = p12.password();
        dict[@"clientP12Configuration"] = cert;
    }
    dict[@"enableCompression"] = [self processBooleanValue:config.enableCompression()];
    dict[@"trustSelfSignedServerCertificate"] = [self processBooleanValue:config.trustSelfSignedServerCertificate()];
    
    return dict;
}
#endif

#pragma react methods implementation

#ifdef RCT_NEW_ARCH_ENABLED
- (void)ensureClientFor:(NSString *)url config:(JS::NativeWebSocketClient::WebSocketClientConfiguration &)config resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    NSDictionary *dict = [self convertConfigurationToDictionary:config];
    [wrapper ensureClientForUrlString:url options:dict resolve:resolve reject:reject];
}

- (void)createClientFor:(NSString *)url config:(JS::NativeWebSocketClient::WebSocketClientConfiguration &)config resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    NSDictionary *dict = [self convertConfigurationToDictionary:config];
    [wrapper createClientForUrlString:url options:dict resolve:resolve reject:reject];
}
#endif

- (void)connectFor:(NSString *)url resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [wrapper connectForUrlString:url resolve:resolve reject:reject];
}



- (void)disconnectFor:(NSString *)url resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    [wrapper disconnectForUrlString:url resolve:resolve reject:reject];
}



- (void)invalidateClientFor:(NSString *)url resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    [wrapper invalidateClientForUrlString:url resolve:resolve reject:reject];
}

- (void)sendDataFor:(NSString *)url data:(NSString *)data resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    [wrapper sendDataForUrlString:url data:data resolve:resolve reject:reject];
}

@end
