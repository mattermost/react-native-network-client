//
//  NetworkClient.m
//  NetworkClient
//
//  Created by Miguel Alatzar on 10/6/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NetworkClient, NSObject)

RCT_EXTERN_METHOD(createApiClientFor:(NSString *)baseUrl withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getApiClientHeadersFor:(NSString *)baseUrl withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(addApiClientHeadersFor:(NSString *)baseUrl withHeaders:(NSDictionary *)headers)

RCT_EXTERN_METHOD(get:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(put:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(post:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(patch:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(delete:(NSString *)baseUrl forEndpoint:(NSString *)endpoint withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

@end
