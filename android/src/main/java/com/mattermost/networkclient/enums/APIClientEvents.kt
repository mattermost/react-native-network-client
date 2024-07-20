package com.mattermost.networkclient.enums

enum class ApiClientEvents(val event: String) {
    DOWNLOAD_PROGRESS("ApiClient-DownloadProgress"),
    UPLOAD_PROGRESS("ApiClient-UploadProgress"),
    CLIENT_ERROR("ApiClient-Error"),
}

enum class SslErrors(val event: Int) {
    SERVER_TRUST_EVALUATION_FAILED(-298)
}
