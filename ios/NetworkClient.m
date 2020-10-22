#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NetworkClient, NSObject)

RCT_EXTERN_METHOD(createClientFor:(NSString *)rootUrl withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get:(NSString *)rootUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(post:(NSString *)rootUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withBody:(NSDictionary *)body withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

@end
