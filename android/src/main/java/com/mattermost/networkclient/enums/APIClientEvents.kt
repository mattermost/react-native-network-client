package com.mattermost.networkclient.enums

enum class APIClientEvents(val event: String) {
    DOWNLOAD_PROGRESS("APIClient-DownloadProgress"),
    UPLOAD_PROGRESS("APIClient-UploadProgress"),
    CLIENT_ERROR("APIClient-Error"),
}
