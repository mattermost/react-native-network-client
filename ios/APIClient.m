//
//  APIClient.m
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(APIClient, RCTEventEmitter)

RCT_EXTERN_METHOD(supportedEvents)

RCT_EXTERN_METHOD(createClientFor:(NSString *)baseUrl withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(invalidateClientFor:(NSString *)baseUrl withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getClientHeadersFor:(NSString *)baseUrl withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(addClientHeadersFor:(NSString *)baseUrl withHeaders:(NSDictionary *)headers withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(put:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(post:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(patch:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(delete:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(upload:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withFileUrl:(NSString *)fileUrlString withTaskId:(NSString *)taskId withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelRequest:(NSString *)taskId withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

@end
