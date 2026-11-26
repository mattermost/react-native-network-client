package com.mattermost.networkclient.interceptors

interface TokenStore {
    fun retrieve(alias: String): String?
    fun store(value: String, alias: String)
    fun delete(alias: String)
}
