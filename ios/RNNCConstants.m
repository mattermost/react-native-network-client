//
//  RNNCConstants.m
//  NetworkClient
//
//  Created by Miguel Alatzar on 11/24/20.
//  Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
//  See LICENSE.txt for license information.
//

#import "RNNCConstants.h"

@implementation RNNCConstants

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport
{
  return @{
    @"EXPONENTIAL_RETRY": @"exponential"
  };
}

@end
