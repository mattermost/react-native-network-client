package com.mattermost.networkclient.enums

enum class ApiClientEvents(val event: String) {
    DOWNLOAD_PROGRESS("ApiClient-DownloadProgress"),
    UPLOAD_PROGRESS("ApiClient-UploadProgress"),
    CLIENT_ERROR("ApiClient-Error"),
}
