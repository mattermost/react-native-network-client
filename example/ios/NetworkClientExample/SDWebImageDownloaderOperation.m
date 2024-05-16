//
//  SDWebImageDownloaderOperation.m
//  NetworkClientExample
//
//  Created by Elias Nahum on 16-05-24.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SDWebImageDownloaderOperation.h"
#import <objc/runtime.h>
#import "NetworkClientExample-Swift.h"

@interface SDWebImageDownloaderOperation (Swizzle)

@end

@implementation SDWebImageDownloaderOperation (Swizzle)

+ (void) load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [self swizzleInitMethod];
    [self swizzleURLSessionTaskDelegateMethod];
  });
}

+ (void) swizzleInitMethod {
  Class class = [self class];
  
  SEL originalSelector = @selector(initWithRequest:inSession:options:context:);
  SEL swizzledSelector = @selector(swizzled_initWithRequest:inSession:options:context:);
  
  Method originalMethod = class_getInstanceMethod(class, originalSelector);
  Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
  
  method_exchangeImplementations(originalMethod, swizzledMethod);
}

+ (void) swizzleURLSessionTaskDelegateMethod {
  Class class = [self class];
  
  SEL originalSelector = @selector(URLSession:task:didReceiveChallenge:completionHandler:);
  SEL swizzledSelector = @selector(swizzled_URLSession:task:didReceiveChallenge:completionHandler:);
  
  Method originalMethod = class_getInstanceMethod(class, originalSelector);
  Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
  
  method_exchangeImplementations(originalMethod, swizzledMethod);
}

#pragma mark - Method Swizzling

- (nonnull instancetype)swizzled_initWithRequest:(NSURLRequest *)request inSession:(NSURLSession *)session options:(SDWebImageDownloaderOptions)options context:(nullable SDWebImageContext *)context {
  
  NSArray *result = [[SDWebImageDownloaderOperationSwizzled shared] swizzled_initWithRequest:request in:session];
  NSURLRequest *req = result[0];
  NSURLSession *ses = result[1];
  
  return [self swizzled_initWithRequest:req inSession:ses options:options context:context];
}

- (void)swizzled_URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler {

  NSArray *result = [[SDWebImageDownloaderOperationSwizzled shared] handleURLSessionWithSession:session task:task challenge:challenge];
  NSURLSessionAuthChallengeDisposition disposition = [result[0] integerValue];
  NSURLCredential *credential = result[1];
      
  if (completionHandler) {
    completionHandler(disposition, credential);
  }

  [self swizzled_URLSession:session task:task didReceiveChallenge:challenge completionHandler:completionHandler];
}

@end
