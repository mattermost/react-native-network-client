package com.mattermost.networkclient.enums

enum class APIClientEvents(val event: String) {
    UPLOAD_PROGRESS("APIClient-UploadProgress"),
    CLIENT_CERTIFICATE_MISSING("APIClient-Client-Certificate-Missing"),
}
