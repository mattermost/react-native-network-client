package com.mattermost.networkclient.sessionattributes

import android.content.Context
import android.net.ConnectivityManager
import android.net.LinkProperties
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Handler
import android.os.HandlerThread
import android.util.Log

/**
 * Tells whether the device network changed between two snapshots. The first
 * snapshot is only a baseline, and a snapshot without a network is ignored so a
 * drop and reconnect to the same network does not count as a change.
 */
class NetworkChangeDetector {
    private var last: NetworkSnapshot? = null

    fun update(snapshot: NetworkSnapshot): Boolean {
        if (snapshot.interfaceType.isEmpty()) {
            return false
        }
        val previous = last
        last = snapshot
        return previous != null && previous != snapshot
    }
}

/**
 * Listens to the default network and calls [onChange] once the network attributes
 * (interface type, SSID, VPN state or IP address) differ from the last ones seen.
 * The OS sends several callbacks for a single switch, so they are debounced and the
 * snapshot is taken once the network has settled.
 */
class SessionAttributesNetworkMonitor(
    private val context: Context,
    private val snapshotProvider: () -> NetworkSnapshot,
    private val onChange: () -> Unit,
) {
    private val detector = NetworkChangeDetector()
    private val thread = HandlerThread("SessionAttributesNetworkMonitor").apply { start() }
    private val handler = Handler(thread.looper)
    private val evaluate = Runnable {
        try {
            if (detector.update(snapshotProvider())) {
                onChange()
            }
        } catch (e: Exception) {
            Log.w("NetworkClient", "Failed to evaluate network change: ${e.message}")
        }
    }

    private val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) = schedule()
        override fun onLost(network: Network) = schedule()
        override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) = schedule()
        override fun onLinkPropertiesChanged(network: Network, linkProperties: LinkProperties) = schedule()
    }

    fun start() {
        try {
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            // The callback only reschedules on [handler], so it can run on the system thread.
            connectivityManager.registerDefaultNetworkCallback(callback)
        } catch (e: Exception) {
            Log.w("NetworkClient", "Failed to watch network changes: ${e.message}")
        }
    }

    private fun schedule() {
        handler.removeCallbacks(evaluate)
        handler.postDelayed(evaluate, DEBOUNCE_MS)
    }

    companion object {
        private const val DEBOUNCE_MS = 1000L
    }
}
