#import "GenericClient.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "NetworkClientSpec.h"
#endif

#if __has_include("react_native_network_client-Swift.h")
#import <react_native_network_client-Swift.h>
#else
#import <react_native_network_client/react_native_network_client-Swift.h>
#endif

@implementation GenericClient {
    GenericClientWrapper *wrapper;
}

-(instancetype) init {
    self = [super init];
    if (self) {
        wrapper = [GenericClientWrapper new];
    }
    
    return self;
}

RCT_EXPORT_MODULE(GenericClient)

RCT_EXPORT_METHOD(head:(NSString *)url withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper headWithUrl:url options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(get:(NSString *)url withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper getWithUrl:url options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(put:(NSString *)url withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper putWithUrl:url options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(post:(NSString *)url withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper postWithUrl:url options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(patch:(NSString *)url withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper patchWithUrl:url options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(methodDelete:(NSString *)url withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper deleteWithUrl:url options:options resolve:resolve reject:reject];
}

#pragma overrides
+ (BOOL)requiresMainQueueSetup {
  return NO;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeGenericClientSpecJSI>(params);
}

#pragma utils

-(NSDictionary *) convertRequestOptionsToDictionary: (JS::NativeGenericClient::RequestOptions &)options {
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    dict[@"headers"] = options.headers();
    dict[@"body"] = options.body();
    if (options.timeoutInterval().has_value()) {
        dict[@"timeoutInterval"] = @(options.timeoutInterval().value());
    }
    
    if (options.retryPolicyConfiguration().has_value()) {
        JS::NativeGenericClient::RetryPolicyConfiguration policy = options.retryPolicyConfiguration().value();
        NSMutableDictionary *policyDictionary = [[NSMutableDictionary alloc] init];
        policyDictionary[@"type"] = policy.type();
        if (policy.retryLimit().has_value()) {
            policyDictionary[@"retryLimit"] = @(policy.retryLimit().value());
        }
        if (policy.retryInterval().has_value()) {
            policyDictionary[@"retryInterval"] = @(policy.retryInterval().value());
        }
        if (policy.exponentialBackoffBase().has_value()) {
            policyDictionary[@"exponentialBackoffBase"] = @(policy.exponentialBackoffBase().value());
        }
        if (policy.exponentialBackoffScale().has_value()) {
            policyDictionary[@"exponentialBackoffScale"] = @(policy.exponentialBackoffScale().value());
        }
        
        if (policy.statusCodes().has_value()) {
            facebook::react::LazyVector<double> lazyVector = policy.statusCodes().value();
            NSMutableArray *statuses = [NSMutableArray arrayWithCapacity:lazyVector.size()];

            for (size_t i = 0; i < lazyVector.size(); ++i) {
                double value = lazyVector[i];
                int intValue = static_cast<int>(value);
                NSNumber *code = [NSNumber numberWithInt:intValue];
                [statuses addObject:code];
            }
            policyDictionary[@"statusCodes"] = statuses;
        }

        NSArray *retryMethods = [RCTConvert NSArray:RCTConvertOptionalVecToArray(policy.retryMethods())];
        policyDictionary[@"retryMethods"] = retryMethods;
        dict[@"retryPolicyConfiguration"] = policyDictionary;
    }
    
    return dict;
}

#pragma react methods implementation

- (void)get:(NSString *)url options:(JS::NativeGenericClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *dict = [self convertRequestOptionsToDictionary:options];
    [wrapper getWithUrl:url options:dict resolve:resolve reject:reject];
}

- (void)head:(NSString *)url options:(JS::NativeGenericClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *dict = [self convertRequestOptionsToDictionary:options];
    [wrapper headWithUrl:url options:dict resolve:resolve reject:reject];
}

- (void)methodDelete:(NSString *)url options:(JS::NativeGenericClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *dict = [self convertRequestOptionsToDictionary:options];
    [wrapper deleteWithUrl:url options:dict resolve:resolve reject:reject];
}

- (void)patch:(NSString *)url options:(JS::NativeGenericClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *dict = [self convertRequestOptionsToDictionary:options];
    [wrapper patchWithUrl:url options:dict resolve:resolve reject:reject];
}

- (void)post:(NSString *)url options:(JS::NativeGenericClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *dict = [self convertRequestOptionsToDictionary:options];
    [wrapper postWithUrl:url options:dict resolve:resolve reject:reject];
}

- (void)put:(NSString *)url options:(JS::NativeGenericClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *dict = [self convertRequestOptionsToDictionary:options];
    [wrapper putWithUrl:url options:dict resolve:resolve reject:reject];
}
#endif
@end
