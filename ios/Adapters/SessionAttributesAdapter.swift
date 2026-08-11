// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation
import Alamofire

@objc public class SessionAttributesAdapter: NSObject, RequestAdapter {
    public func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
        guard let baseUrl = session.baseUrl else {
            completion(.success(urlRequest))
            return
        }

        var urlRequest = urlRequest

        let hasAuthorization = urlRequest.value(forHTTPHeaderField: "Authorization") != nil
        let hasSessionAttributes = urlRequest.value(forHTTPHeaderField: SessionAttributesConstants.headerName) != nil

        if hasAuthorization,
           !hasSessionAttributes,
           let header = SessionAttributes.getOutboundHeader(baseUrl.absoluteString) {
            urlRequest.setValue(header, forHTTPHeaderField: SessionAttributesConstants.headerName)
        }

        completion(.success(urlRequest))
    }
}
