import Foundation

@objc public protocol ApiClientDelegate {
    func sendEvent(name: String, result: Dictionary<String, Any>?)
}

enum ApiEvents: String, CaseIterable {
    case UPLOAD_PROGRESS = "ApiClient-UploadProgress"
    case DOWNLOAD_PROGRESS = "ApiClient-DownloadProgress"
    case CLIENT_ERROR = "ApiClient-Error"
}

extension ApiClientWrapper {
    @objc
    public static var supportedEvents: [String] {
        return ApiEvents.allCases.map(\.rawValue)
    }
}

