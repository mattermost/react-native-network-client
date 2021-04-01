package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mattermost.networkclient.SessionsObject
import okhttp3.*
import java.util.concurrent.TimeUnit
import com.mattermost.networkclient.interceptors.*
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.internal.immutableListOf
import org.json.JSONObject

/**
 * Parses the response data into the format expected by the App
 *
 * @return WriteableMap for passing back to App
 */
fun Response.returnAsWriteableMap(): WritableMap {
    val headers = Arguments.createMap();
    this.headers.forEach { k -> headers.putString(k.first, k.second) }

    val map = Arguments.createMap()
    map.putMap("headers", headers)
    map.putString("data", this.body!!.string())
    map.putInt("code", this.code)
    map.putBoolean("ok", this.isSuccessful)
    map.putString("lastRequestedUrl", this.request.url.toString())
    return map;
}

/**
 * Completes the response handling by calling a promise resolve / reject based on response type
 *
 * @param promise The promise to resolve/reject
 */
fun Response.promiseResolution(promise: Promise): Response {
    if (this.isSuccessful) {
        promise.resolve(this.returnAsWriteableMap());
    } else {
        promise.reject(this.code.toString(), this.returnAsWriteableMap())
    }
    return this
}

/**
 * Parses options passed in over the bridge for individual requests
 *
 * @param options ReadableMap of options from the App
 */
fun Request.Builder.parseOptions(options: ReadableMap?, session: OkHttpClient.Builder, baseUrl: String): Request.Builder {
    // Need to always close the connection once finished
    this.header("Connection", "close")

    if (options == null) return this;

    // Timeout Interval per request
    if (options.hasKey("timeoutInterval")) {
        session.addInterceptor(TimeoutRequestInterceptor(options.getInt("timeoutInterval")))
    }

    // Headers
    if (options.hasKey("headers")) {
        this.addHeadersAsReadableMap(options.getMap("headers")!!)
    }

    if (options.hasKey("retryPolicyConfiguration")) {
        val retryPolicyConfiguration = options.getMap("retryPolicyConfiguration")!!.toHashMap();

        SessionsObject.config[baseUrl]!!["retryRequest"] = mutableMapOf(
                Pair("retryType", retryPolicyConfiguration["type"] as String?),
                Pair("retryLimit", retryPolicyConfiguration["retryLimit"] as Double?),
                Pair("retryInterval", retryPolicyConfiguration["retryInterval"] as Double?),
                Pair("retryExponentialBackoffBase", retryPolicyConfiguration["exponentialBackoffBase"] as Double?),
                Pair("retryExponentialBackoffScale", retryPolicyConfiguration["exponentialBackoffScale"] as Double?),
        )

        session.addInterceptor(RetryInterceptor())
    }

    return this;
}

/**
 * Parses options passed in over the bridge for client sessions
 *
 * @params options ReadableMap of options from the App
 */
fun OkHttpClient.Builder.parseOptions(options: ReadableMap?, request: Request.Builder?, baseUrl: String): OkHttpClient.Builder {
    if (options == null) return this;

    // Following Redirects
    if (options.hasKey("followRedirects")) {
        val followRedirects = options.getBoolean("followRedirects")
        this.followRedirects(followRedirects)
        this.followSslRedirects(followRedirects)
    }

    // Retries
    this.retryOnConnectionFailure(false);
    if (options.hasKey("retryPolicyConfiguration")) {
        val retryPolicyConfiguration = options.getMap("retryPolicyConfiguration")!!.toHashMap();

        SessionsObject.config[baseUrl]!!["retryClient"] = mutableMapOf(
                Pair("retryType", retryPolicyConfiguration["type"] as String?),
                Pair("retryLimit", retryPolicyConfiguration["retryLimit"] as Double?),
                Pair("retryInterval", retryPolicyConfiguration["retryInterval"] as Double?),
                Pair("retryExponentialBackoffBase", retryPolicyConfiguration["exponentialBackoffBase"] as Double?),
                Pair("retryExponentialBackoffScale", retryPolicyConfiguration["exponentialBackoffScale"] as Double?),
        )

        this.addInterceptor(RetryInterceptor())
    }

    // Headers
    if (options.hasKey("headers")) {
        request?.addHeadersAsReadableMap(options.getMap("headers")!!)
    }

    // Session Configuration
    if (options.hasKey("sessionConfiguration")) {
        val sessionConfig = options.getMap("sessionConfiguration")!!;

        if (sessionConfig.hasKey("followRedirects")) {
            val followRedirects = sessionConfig.getBoolean("followRedirects")
            this.followRedirects(followRedirects);
            this.followSslRedirects(followRedirects);
        }

        if (sessionConfig.hasKey("timeoutIntervalForRequest")) {
            this.callTimeout(sessionConfig.getInt("timeoutIntervalForRequest").toLong(), TimeUnit.SECONDS)
            this.connectTimeout(sessionConfig.getInt("timeoutIntervalForRequest").toLong(), TimeUnit.SECONDS)
            this.readTimeout(sessionConfig.getInt("timeoutIntervalForRequest").toLong(), TimeUnit.SECONDS)
        }

        if (sessionConfig.hasKey("timeoutIntervalForResource")) {
            this.callTimeout(sessionConfig.getInt("timeoutIntervalForResource").toLong(), TimeUnit.SECONDS)
            this.connectTimeout(sessionConfig.getInt("timeoutIntervalForResource").toLong(), TimeUnit.SECONDS)
            this.writeTimeout(sessionConfig.getInt("timeoutIntervalForResource").toLong(), TimeUnit.SECONDS)
        }

        if (sessionConfig.hasKey("httpMaximumConnectionsPerHost")) {
            val maxConnections = sessionConfig.getInt("httpMaximumConnectionsPerHost");
            val dispatcher = Dispatcher()
            dispatcher.maxRequests = maxConnections
            dispatcher.maxRequestsPerHost = maxConnections
            this.dispatcher(dispatcher);
        }

        // WS: Timeout
        if (sessionConfig.hasKey("timeoutInterval")) {
            this.connectTimeout(sessionConfig.getInt("timeoutInterval").toLong(), TimeUnit.SECONDS)
            this.readTimeout(sessionConfig.getInt("timeoutInterval").toLong(), TimeUnit.SECONDS)
            this.callTimeout(sessionConfig.getInt("timeoutInterval").toLong(), TimeUnit.SECONDS)
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
    return baseUrl.toHttpUrlOrNull()!!.newBuilder().addPathSegments(endpoint.trim { c -> c == '/' }).build().toString()
}

/**
 *
 */
fun String.trimSlashes(): String {
    return this.trim { c -> c == '/' }
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
