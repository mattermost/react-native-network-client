package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mattermost.networkclient.SessionsObject
import com.mattermost.networkclient.enums.RetryTypes
import okhttp3.*
import com.mattermost.networkclient.interceptors.*
import com.mattermost.networkclient.interfaces.RetryConfig
import com.mattermost.networkclient.interfaces.TimeoutConfig
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

var Response.retriesExhausted: Boolean
    get() {
        return retriesExhausted
    }
    set(value: Boolean) {
        this.retriesExhausted = value
    }

/**
 * Parses the response data into the format expected by the App
 *
 * @return WriteableMap for passing back to App
 */
fun Response.returnAsWriteableMap(baseUrl: String): WritableMap {
    val headers = Arguments.createMap();
    this.headers.forEach { k -> headers.putString(k.first, k.second) }

    val map = Arguments.createMap()
    map.putMap("headers", headers)
    map.putString("data", this.body!!.string())
    map.putInt("code", this.code)
    map.putBoolean("ok", this.isSuccessful)
    map.putString("lastRequestedUrl", this.request.url.toString())
    if (this.retriesExhausted != null) {
        map.putBoolean("retriesExhausted", this.retriesExhausted as Boolean)
    }

    return map;
}

/**
 * Parses options passed in over the bridge for individual requests
 *
 * @param options ReadableMap of options from the App
 */
fun Request.Builder.applyClientOptions(baseUrl: String): Request.Builder{
    // Headers
    if(SessionsObject.requestConfig[baseUrl]!!.containsKey("clientHeaders")){
        this.addHeadersAsReadableMap(SessionsObject.requestConfig[baseUrl]!!["clientHeaders"] as ReadableMap)
    }

    return this;
}

fun Request.Builder.applyRequestOptions(options: ReadableMap?, baseUrl: String): Request.Builder {
    // Need to always close the connection once finished
    this.header("Connection", "close")

    if (options == null) return this;

    val session = SessionsObject.client[baseUrl]!!;

    // Timeout Interval per request
    val timeoutConfig: TimeoutConfig = SessionsObject.DefaultTimeout;
    if (options.hasKey("timeoutInterval")) {
        timeoutConfig.read = options.getDouble("timeoutInterval")
        timeoutConfig.write = timeoutConfig.read
    }
    if (options.hasKey("timeoutIntervalForRequest")) {
        timeoutConfig.read = options.getDouble("timeoutIntervalForRequest")
    }
    if (options.hasKey("timeoutIntervalForResource")) {
        timeoutConfig.write = options.getDouble("timeoutIntervalForResource")
    }

    SessionsObject.requestConfig[baseUrl]!!["requestTimeout"] = timeoutConfig

    if (options.hasKey("headers")) {
        this.addHeadersAsReadableMap(options.getMap("headers")!!)
    }

    if (options.hasKey("retryPolicyConfiguration")) {
        val retryPolicyConfiguration = options.getMap("retryPolicyConfiguration")!!;

        SessionsObject.requestConfig[baseUrl]!!["retryRequest"] = object: RetryConfig {
            override val retryType = RetryTypes.values().find { r -> r.type == retryPolicyConfiguration.getString("type")} ?: SessionsObject.DefaultRetry.retryType
            override val retryLimit = retryPolicyConfiguration.getDouble("retryLimit")
            override val retryInterval = retryPolicyConfiguration.getDouble("retryInterval")
            override val retryExponentialBackOffBase = retryPolicyConfiguration.getDouble("exponentialBackoffBase")
            override val retryExponentialBackOffScale = retryPolicyConfiguration.getDouble("exponentialBackoffScale")
            override val retryStatusCodes = if(retryPolicyConfiguration.hasKey("statusCodes") && retryPolicyConfiguration.getArray("statusCodes") != null) {
                (retryPolicyConfiguration.getArray("statusCodes")!!.toArrayList() as ArrayList<Double>).map { code -> code.toInt() }.toSet()
            } else {
                SessionsObject.DefaultRetry.retryStatusCodes;
            }
            override val retryMethods = if(retryPolicyConfiguration.hasKey("retryMethods") && retryPolicyConfiguration.getArray("retryMethods") != null) {
                (retryPolicyConfiguration.getArray("retryMethods")!!.toArrayList() as ArrayList<String>).toSet()
            } else {
                SessionsObject.DefaultRetry.retryMethods;
            }
        }

    }

    return this;
}

/**
 * Parses options passed in over the bridge for client sessions
 *
 * @params options ReadableMap of options from the App
 */
fun OkHttpClient.Builder.applyClientOptions(options: ReadableMap?, baseUrl: String): OkHttpClient.Builder {
    if (options == null) return this;

    // Following Redirects
    if (options.hasKey("followRedirects")) {
        val followRedirects = options.getBoolean("followRedirects")
        this.followRedirects(followRedirects)
        this.followSslRedirects(followRedirects)
    }

    // Retries
    this.retryOnConnectionFailure(false);
    this.addInterceptor(RetryInterceptor(baseUrl))

    // Timeouts
    this.addInterceptor(TimeoutRequestInterceptor(baseUrl))

    if (options.hasKey("retryPolicyConfiguration")) {
        val retryPolicyConfiguration = options.getMap("retryPolicyConfiguration")!!;

        SessionsObject.requestConfig[baseUrl]!!["retryClient"] = object: RetryConfig {
            override val retryType = RetryTypes.values().find { r -> r.type == retryPolicyConfiguration.getString("type")} ?: SessionsObject.DefaultRetry.retryType
            override val retryLimit = retryPolicyConfiguration.getDouble("retryLimit")
            override val retryInterval = retryPolicyConfiguration.getDouble("retryInterval")
            override val retryExponentialBackOffBase = retryPolicyConfiguration.getDouble("exponentialBackoffBase")
            override val retryExponentialBackOffScale = retryPolicyConfiguration.getDouble("exponentialBackoffScale")
            override val retryStatusCodes = if(retryPolicyConfiguration.hasKey("statusCodes") && retryPolicyConfiguration.getArray("statusCodes") != null) {
                (retryPolicyConfiguration.getArray("statusCodes")!!.toArrayList() as ArrayList<Double>).map { code -> code.toInt() }.toSet()
            } else {
                SessionsObject.DefaultRetry.retryStatusCodes;
            }
            override val retryMethods = if(retryPolicyConfiguration.hasKey("retryMethods") && retryPolicyConfiguration.getArray("retryMethods") != null) {
                (retryPolicyConfiguration.getArray("retryMethods")!!.toArrayList() as ArrayList<String>).toSet()
            } else {
                SessionsObject.DefaultRetry.retryMethods;
            }
        }
    }

    // Headers
    if (options.hasKey("headers")) {
        SessionsObject.requestConfig[baseUrl]!!["clientHeaders"] = options.getMap("headers") as Any
    }

    // Session Configuration
    if (options.hasKey("sessionConfiguration")) {
        val sessionConfig = options.getMap("sessionConfiguration")!!;

        if (sessionConfig.hasKey("followRedirects")) {
            val followRedirects = sessionConfig.getBoolean("followRedirects")
            this.followRedirects(followRedirects);
            this.followSslRedirects(followRedirects);
        }

        val timeoutConfig: TimeoutConfig = SessionsObject.DefaultTimeout;
        if (sessionConfig.hasKey("timeoutInterval")) {
            timeoutConfig.read = sessionConfig.getDouble("timeoutInterval")
            timeoutConfig.write = timeoutConfig.read
        }
        if (sessionConfig.hasKey("timeoutIntervalForRequest")) {
            timeoutConfig.read = sessionConfig.getDouble("timeoutIntervalForRequest")
        }
        if (sessionConfig.hasKey("timeoutIntervalForResource")) {
            timeoutConfig.write = sessionConfig.getDouble("timeoutIntervalForResource")
        }

        SessionsObject.requestConfig[baseUrl]!!["clientTimeout"] = timeoutConfig

        if (sessionConfig.hasKey("httpMaximumConnectionsPerHost")) {
            val maxConnections = sessionConfig.getInt("httpMaximumConnectionsPerHost");
            val dispatcher = Dispatcher()
            dispatcher.maxRequests = maxConnections
            dispatcher.maxRequestsPerHost = maxConnections
            this.dispatcher(dispatcher);
        }

        // WS: Compression
        if (sessionConfig.hasKey("enableCompression")) {
            this.minWebSocketMessageToCompress(0);
        }
    }

    return this
}

/**
 * Parses the header data into the format expected by the App
 *
 * @return WriteableMap for passing back to App
 */
fun Headers.readableMap(): ReadableMap {
    val headersMap = Arguments.createMap()
    this.forEach { (k, v) -> headersMap.putString(k, v) }
    return headersMap
}

/**
 * Adds the headers object passed in by the app to the request
 *
 * @options headers ReadableMap
 */
fun Request.Builder.addHeadersAsReadableMap(headers: ReadableMap): Request.Builder {
    for ((k, v) in headers.toHashMap()) {
        this.removeHeader(k);
        this.addHeader(k, v as String);
    }
    return this
}

/**
 * Transforms the "body" for a POST/PATCH/PUT/DELETE request to a Request Body
 *
 * @return RequestBody
 */
fun ReadableMap.bodyToRequestBody(): RequestBody {
    if (!this.hasKey("body")) return "".toRequestBody()
    return if (this.getType("body") === ReadableType.Map) {
        JSONObject(this.getMap("body")!!.toHashMap()).toString().toRequestBody()
    } else {
        this.getString("body")!!.toRequestBody()
    }
}

/**
 * Forms a URL String from the given params
 *
 * @param baseUrl
 * @param endpoint
 * @return url string
 */
fun formUrlString(baseUrl: String, endpoint: String): String {
    return baseUrl.toHttpUrl().newBuilder().addPathSegments(endpoint.trim { c -> c == '/' }).build().toString()
}

/**
 * Trims leading / trailing slashes in a string; ideal for URL's
 */
fun String.trimSlashes(): String {
    return this.trim { c -> c == '/' }
}

fun String.toUrlString(): String {
    return this.toHttpUrl().toString();
}

/**
 * Emit an event to the JS Application
 *
 * @param reactContext
 * @param eventName
 * @param params
 */
fun emitEvent(reactContext: ReactContext, eventName: String, params: Any) {
    reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, params)
}


