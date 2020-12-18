//
//  SDWebImageDownloaderOperation+initWithRequest.m
//  NetworkClientExample
//
//  Created by Miguel Alatzar on 12/2/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

#import "SDWebImageDownloaderOperation+initWithRequest.h"
@import react_native_network_client;
#import <objc/runtime.h>

@implementation SDWebImageDownloaderOperation (initWithRequest)

+ (void) load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [self class];
    
    SEL originalSelector = @selector(initWithRequest:inSession:options:context:);
    SEL swizzledSelector = @selector(swizzle_initWithRequest:inSession:options:context:);
    
    Method originalMethod = class_getInstanceMethod(class, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
    
    method_exchangeImplementations(originalMethod, swizzledMethod);
  });
}

#pragma mark - Method Swizzling

- (nonnull instancetype)swizzle_initWithRequest:(NSURLRequest *)request inSession:(NSURLSession *)session options:(SDWebImageDownloaderOptions)options context:(nullable SDWebImageContext *)context {
  NSString *host = [[request URL] host];
  SessionManager *nativeClientSessionManager = [SessionManager default];
  NSURLSessionConfiguration *configuration = [nativeClientSessionManager getSessionConfigurationFor:host];
  // If we have a session configured for this host then use this configuration
  // to create a new session that SDWebImageDownloaderOperation will use for
  // the request. In addition, if we have an authorization header being added
  // to our session's requests, then we modify the request here as well using
  // our BearerAuthenticationAdapter.
  if (configuration != nil) {
    NSURLSession *newSession = [NSURLSession sessionWithConfiguration:configuration
                                                        delegate:session.delegate
                                                        delegateQueue:session.delegateQueue];
    NSURLRequest *authorizedRequest = [BearerAuthenticationAdapter addAuthorizationBearerTokenTo:request];
    
    return [self swizzle_initWithRequest:authorizedRequest inSession:newSession options:options context:context];
  }
  
  return [self swizzle_initWithRequest:request inSession:session options:options context:context];
}

@end
