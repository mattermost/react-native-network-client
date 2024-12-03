package com.mattermost.networkclient.metrics

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build

fun getNetworkType(context: Context): String {
    val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = connectivityManager.activeNetwork ?: return "No Network"
    val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return "Unknown"

    return when {
        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "Wi-Fi"
        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
            when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_RESTRICTED) -> "5G"
                capabilities.linkDownstreamBandwidthKbps >= 30000 -> "4G"
                capabilities.linkDownstreamBandwidthKbps >= 1000 -> "3G"
                else -> "2G"
            }
        }
        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "Wired Ethernet"
        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> "Bluetooth"
        else -> "Other"
    }
}
