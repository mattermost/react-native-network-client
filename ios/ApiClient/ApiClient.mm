#import "ApiClient.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "NetworkClientSpec.h"
#endif

#if __has_include("react_native_network_client-Swift.h")
#import <react_native_network_client-Swift.h>
#else
#import <react_native_network_client/react_native_network_client-Swift.h>
#endif

@interface ApiClient () <ApiClientDelegate>
@end

@implementation ApiClient {
    ApiClientWrapper *wrapper;
}

-(instancetype) init {
    self = [super init];
    if (self) {
        wrapper = [ApiClientWrapper new];
        wrapper.delegate = self;
        [wrapper captureEvents];
    }
    
    return self;
}

RCT_EXPORT_MODULE(ApiClient)

RCT_EXPORT_METHOD(createClientFor:(NSString *)baseUrl withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper createClientForBaseUrlString:baseUrl options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(invalidateClientFor:(NSString *)baseUrl withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper invalidateClientForBaseUrlString:baseUrl resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(getClientHeadersFor:(NSString *)baseUrl withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper getClientHeadersForBaseUrlString:baseUrl resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(addClientHeadersFor:(NSString *)baseUrl withHeaders:(NSDictionary *)headers withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper addClientHeadersForBaseUrlString:baseUrl headers:headers resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(importClientP12For:(NSString *)baseUrl withPath:(NSString *)path withPassword:(NSString *)password withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper importClientP12ForBaseUrlString:baseUrl path:path password:password resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(head:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper headWithBaseUrl:baseUrl endpoint:endpoint options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(get:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper getWithBaseUrl:baseUrl endpoint:endpoint options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(put:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper putWithBaseUrl:baseUrl endpoint:endpoint options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(post:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper postWithBaseUrl:baseUrl endpoint:endpoint options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(patch:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper patchWithBaseUrl:baseUrl endpoint:endpoint options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(methodDelete:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper deleteWithBaseUrl:baseUrl endpoint:endpoint options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(upload:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withFileUrl:(NSString *)fileUrlString withTaskId:(NSString *)taskId withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper uploadWithBaseUrlString:baseUrl endpoint:endpoint fileUrlString:fileUrlString taskId:taskId options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(download:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withFilePath:(NSString *)filePathString withTaskId:(NSString *)taskId withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper downloadWithBaseUrlString:baseUrl endpoint:endpoint filePath:filePathString taskId:taskId options:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(cancelRequest:(NSString *)taskId withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject) {
    [wrapper cancelRequest:taskId withResolver:resolve withRejecter:reject];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeApiClientSpecJSI>(params);
}
#endif


#pragma protocol

- (void)sendEventWithName:(NSString * _Nonnull)name result:(NSDictionary<NSString *,id> * _Nullable)result {
    [self sendEventWithName:name body:result];
}

- (NSArray<NSString *> *)supportedEvents {
  return [ApiClientWrapper supportedEvents];
}

#pragma overrides
+ (BOOL)requiresMainQueueSetup {
  return NO;
}

#pragma react methods implementation

- (void)addClientHeadersFor:(NSString *)baseUrl headers:(NSDictionary *)headers resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [wrapper addClientHeadersForBaseUrlString:baseUrl headers:headers resolve:resolve reject:reject];
}

- (void)cancelRequest:(NSString *)taskId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [wrapper cancelRequest:taskId withResolver:resolve withRejecter:reject];
}

- (void)getClientHeadersFor:(NSString *)baseUrl resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [wrapper getClientHeadersForBaseUrlString:baseUrl resolve:resolve reject:reject];
}

- (void)importClientP12For:(NSString *)baseUrl path:(NSString *)path password:(NSString *)password resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [wrapper importClientP12ForBaseUrlString:baseUrl path:path password:password resolve:resolve reject:reject];
}

- (void)invalidateClientFor:(NSString *)baseUrl resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [wrapper invalidateClientForBaseUrlString:baseUrl resolve:resolve reject:reject];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (void)createClientFor:(NSString *)baseUrl config:(JS::NativeApiClient::ApiClientConfiguration &)config resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    NSDictionary *options = [self convertClientConfigurationToDictionary:config];
    [wrapper createClientForBaseUrlString:baseUrl options:options resolve:resolve reject:reject];
}

- (void)download:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint filePath:(NSString *)filePath taskId:(NSString *)taskId options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper downloadWithBaseUrlString:baseUrl endpoint:endpoint filePath:filePath taskId:taskId options:opts resolve:resolve reject:reject];
}

- (void)get:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper getWithBaseUrl:baseUrl endpoint:endpoint options:opts resolve:resolve reject:reject];
}

- (void)head:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper headWithBaseUrl:baseUrl endpoint:endpoint options:opts resolve:resolve reject:reject];
}

- (void)methodDelete:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper deleteWithBaseUrl:baseUrl endpoint:endpoint options:opts resolve:resolve reject:reject];
}

- (void)patch:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper patchWithBaseUrl:baseUrl endpoint:endpoint options:opts resolve:resolve reject:reject];
}

- (void)post:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper postWithBaseUrl:baseUrl endpoint:endpoint options:opts resolve:resolve reject:reject];
}

- (void)put:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint options:(JS::NativeApiClient::RequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
    NSDictionary *opts = [self convertRequestOptionsToDictionary:options];
    [wrapper putWithBaseUrl:baseUrl endpoint:endpoint options:opts resolve:resolve reject:reject];
}

- (void)upload:(NSString *)baseUrl endpoint:(NSString * _Nullable)endpoint fileUrl:(NSString *)fileUrl taskId:(NSString *)taskId options:(JS::NativeApiClient::UploadRequestOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    NSDictionary *opts = [self convertUploadRequestOptionsToDictionary:options];
    [wrapper uploadWithBaseUrlString:baseUrl endpoint:endpoint fileUrlString:fileUrl taskId:taskId options:opts resolve:resolve reject:reject];
}

#pragma utils

- (NSNumber *)processBooleanValue:(std::optional<bool>)optionalBoolValue {
    // Use the boolean value
    if (optionalBoolValue.has_value()) {
        return [NSNumber numberWithBool:optionalBoolValue.value()];
    }

    return 0;
}

-(NSDictionary *) convertClientConfigurationToDictionary: (JS::NativeApiClient::ApiClientConfiguration &)config {
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    dict[@"headers"] = config.headers();
    if (config.sessionConfiguration().has_value()) {
        NSMutableDictionary *sessionDictionary = [[NSMutableDictionary alloc] init];
        JS::NativeApiClient::SessionConfiguration session = config.sessionConfiguration().value();
        sessionDictionary[@"allowsCellularAccess"] = [self processBooleanValue:session.allowsCellularAccess()];
        sessionDictionary[@"waitsForConnectivity"] = [self processBooleanValue:session.waitsForConnectivity()];
        sessionDictionary[@"cancelRequestsOnUnauthorized"] = [self processBooleanValue:session.cancelRequestsOnUnauthorized()];
        sessionDictionary[@"trustSelfSignedServerCertificate"] = [self processBooleanValue:session.trustSelfSignedServerCertificate()];
        
        if (session.timeoutIntervalForRequest().has_value()) {
            sessionDictionary[@"timeoutIntervalForRequest"] = @(session.timeoutIntervalForRequest().value());
        }
        
        if (session.timeoutIntervalForResource().has_value()) {
            sessionDictionary[@"timeoutIntervalForResource"] = @(session.timeoutIntervalForResource().value());
        }
        
        if (session.httpMaximumConnectionsPerHost().has_value()) {
            sessionDictionary[@"httpMaximumConnectionsPerHost"] = @(session.httpMaximumConnectionsPerHost().value());
        }
        
        dict[@"sessionConfiguration"] = sessionDictionary;
    }
    
    if (config.retryPolicyConfiguration().has_value()) {
        JS::NativeApiClient::RetryPolicyConfiguration policy = config.retryPolicyConfiguration().value();
        NSDictionary *policyDictionary = [self convertRetryPolicyToDictionary:policy];
        dict[@"retryPolicyConfiguration"] = policyDictionary;
    }
    
    if (config.requestAdapterConfiguration().has_value()) {
        NSMutableDictionary *adapterDictionary = [[NSMutableDictionary alloc] init];
        adapterDictionary[@"bearerAuthTokenResponseHeader"] = config.requestAdapterConfiguration().value().bearerAuthTokenResponseHeader();
    }
    
    if (config.clientP12Configuration().has_value()) {
        NSMutableDictionary *cert = [[NSMutableDictionary alloc] init];
        JS::NativeApiClient::ClientP12Configuration p12 = config.clientP12Configuration().value();
        cert[@"path"] = p12.path();
        cert[@"password"] = p12.password();
        dict[@"clientP12Configuration"] = cert;
    }
    
    return dict;
}

-(NSDictionary *) convertRetryPolicyToDictionary: (JS::NativeApiClient::RetryPolicyConfiguration &) policy {
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
    return policyDictionary;
}

-(NSDictionary *) convertRequestOptionsToDictionary: (JS::NativeApiClient::RequestOptions &)options {
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    dict[@"headers"] = options.headers();
    dict[@"body"] = options.body();
    if (options.timeoutInterval().has_value()) {
        dict[@"timeoutInterval"] = @(options.timeoutInterval().value());
    }
    
    if (options.retryPolicyConfiguration().has_value()) {
        JS::NativeApiClient::RetryPolicyConfiguration policy = options.retryPolicyConfiguration().value();
        NSDictionary *policyDictionary = [self convertRetryPolicyToDictionary:policy];
        dict[@"retryPolicyConfiguration"] = policyDictionary;
    }
    
    return dict;
}

-(NSDictionary *)convertUploadRequestOptionsToDictionary: (JS::NativeApiClient::UploadRequestOptions &)options {
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    dict[@"headers"] = options.headers();
    dict[@"body"] = options.body();
    dict[@"method"] = options.method();
    if (options.timeoutInterval().has_value()) {
        dict[@"timeoutInterval"] = @(options.timeoutInterval().value());
    }
    
    if (options.retryPolicyConfiguration().has_value()) {
        JS::NativeApiClient::RetryPolicyConfiguration policy = options.retryPolicyConfiguration().value();
        NSDictionary *policyDictionary = [self convertRetryPolicyToDictionary:policy];
        dict[@"retryPolicyConfiguration"] = policyDictionary;
    }
    
    if (options.skipBytes().has_value()) {
        dict[@"skipBytes"] = @(options.skipBytes().value());
    }
    
    if (options.multipart().has_value()) {
        JS::NativeApiClient::MultipartUploadConfig multipart = options.multipart().value();
        NSMutableDictionary *multipartDictionary = [[NSMutableDictionary alloc] init];
        multipartDictionary[@"fileKey"] = multipart.fileKey();
        multipartDictionary[@"data"] = multipart.data();
        dict[@"multipart"] = multipartDictionary;
    }
    
    return dict;
}
#endif

@end
