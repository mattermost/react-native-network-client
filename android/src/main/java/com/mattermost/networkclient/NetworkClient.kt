package com.mattermost.networkclient

import com.facebook.react.bridge.ReadableMap
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.interceptors.LinearRetryInterceptor
import com.mattermost.networkclient.interceptors.ExponentialRetryInterceptor
import com.mattermost.networkclient.interceptors.TimeoutInterceptor
import com.mattermost.networkclient.interceptors.RuntimeInterceptor
import okhttp3.*
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mattermost.networkclient.interfaces.RetryInterceptor
import kotlin.reflect.KProperty

class NetworkClient(private val baseUrl: HttpUrl? = null, private val options: ReadableMap? = null) {
    private var okHttpClient: OkHttpClient
    var webSocket: WebSocket? = null
    var clientHeaders: WritableMap = Arguments.createMap()
    var clientRetryInterceptor: Interceptor? = null
    var clientTimeoutInterceptor: TimeoutInterceptor
    val requestRetryInterceptors: HashMap<Request, Interceptor> = hashMapOf()
    val requestTimeoutInterceptors: HashMap<Request, TimeoutInterceptor> = hashMapOf()
    private val builder: OkHttpClient.Builder = OkHttpClient().newBuilder()

    companion object RequestRetriesExhausted {
        private val requestRetriesExhausted: HashMap<Response, Boolean?> = hashMapOf()

        operator fun getValue(response: Response, property: KProperty<*>): Boolean? {
            return requestRetriesExhausted[response]
        }

        operator fun setValue(response: Response, property: KProperty<*>, value: Boolean?) {
            requestRetriesExhausted[response] = value
        }
    }

    init {
        setClientHeaders(options)
        clientRetryInterceptor = createRetryInterceptor(options)
        clientTimeoutInterceptor = createClientTimeoutInterceptor(options)

        builder.retryOnConnectionFailure(false);
        builder.addInterceptor(RuntimeInterceptor(this, "retry"))
        builder.addInterceptor(RuntimeInterceptor(this, "timeout"))
        applyBuilderOptions()

        okHttpClient = builder.build()
    }

    fun addClientHeaders(additionalHeaders: ReadableMap?) {
        if (additionalHeaders != null) {
            for ((k, v) in additionalHeaders.toHashMap()) {
                clientHeaders.putString(k, v as String)
            }
        }
    }

    fun request(method: String, endpoint: String, options: ReadableMap?): Response {
        var requestHeaders: ReadableMap? = null
        var requestBody: RequestBody? = null

        if (options != null) {
            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")
            }
            if (options.hasKey("body")) {
                requestBody = options.getMap("body")?.bodyToRequestBody()
            }
        }

        val request = buildRequest(method, endpoint, requestHeaders, requestBody)

        val timeoutInterceptor = createRequestTimeoutInterceptor(options)
        if (timeoutInterceptor != null) {
            requestTimeoutInterceptors[request] = timeoutInterceptor
        }

        val retryInterceptor = createRetryInterceptor(options)
        if (retryInterceptor != null) {
            requestRetryInterceptors[request] = retryInterceptor
        }

        return okHttpClient
                .newCall(request)
                .execute()
    }

    fun cleanUpAfter(response: Response) {
        requestRetriesExhausted.remove(response.request)
        requestRetryInterceptors.remove(response.request)
        requestTimeoutInterceptors.remove(response.request)
    }

    fun buildUploadCall(endpoint: String, fileUri: Uri, fileBody: RequestBody, options: ReadableMap?): Call {
        var method = "POST"
        var requestHeaders: ReadableMap? = null
        var multipartOptions: ReadableMap? = null

        if (options != null) {
            if (options.hasKey("method")) {
                method = options.getString("method")!!
            }

            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")
            }

            if (options.hasKey("multipart")) {
                multipartOptions = options.getMap("multipart")
            }
        }


        val requestBody = if (multipartOptions != null) {
            buildMultipartBody(fileUri, fileBody, multipartOptions)
        } else {
            fileBody
        }

        val request = buildRequest(method, endpoint, requestHeaders, requestBody)

        return okHttpClient.newCall(request)
    }

    fun createWebSocket(listener: WebSocketEventListener) {
        val request = Request.Builder().build()

        webSocket = okHttpClient.newWebSocket(request, listener)
    }

    private fun buildRequest(method: String, endpoint: String, headers: ReadableMap?, body: RequestBody?): Request {
        return Request.Builder()
                .url(composeEndpointUrl(endpoint))
                .applyHeaders(clientHeaders)
                .applyHeaders(headers)
                .method(method, body)
                .build();
    }

    private fun buildMultipartBody(uri: Uri, fileBody: RequestBody, multipartOptions: ReadableMap): RequestBody {
        val multipartBody = MultipartBody.Builder();
        multipartBody.setType(MultipartBody.FORM)

        var name = "files"
        if (multipartOptions.hasKey("fileKey")) {
            name = multipartOptions.getString("fileKey")!!
        }
        multipartBody.addFormDataPart(name, uri.lastPathSegment, fileBody)

        if (multipartOptions.hasKey("data")) {
            val multipartData = multipartOptions.getMap("data")!!.toHashMap();
            for ((k, v) in multipartData) {
                multipartBody.addFormDataPart(k, v as String);
            }
        }

        return multipartBody.build()
    }

    private fun composeEndpointUrl(endpoint: String) : String {
        if (baseUrl == null) {
            return endpoint
        }

        return baseUrl
                .newBuilder()
                .addPathSegments(endpoint.trim { c -> c == '/' })
                .build()
                .toString()
    }

    private fun setClientHeaders(options: ReadableMap?) {
        if (options != null && options.hasKey(("headers"))) {
            addClientHeaders(options.getMap("headers"))
        }
    }

    private fun createRetryInterceptor(options: ReadableMap?): Interceptor? {
        if (options == null || !options.hasKey("retryPolicyConfiguration"))
            return null

        val retryConfig = options.getMap("retryPolicyConfiguration")
                ?: return null

        if (!retryConfig.hasKey("type"))
            return null

        val retryType = RetryTypes.values().find { r -> r.type == retryConfig.getString("type") }
                ?: return null

        var retryLimit = RetryInterceptor.defaultRetryLimit
        if (retryConfig.hasKey("retryLimit")) {
            retryLimit = retryConfig.getDouble("retryLimit")!!
        }

        var retryMethods = RetryInterceptor.defaultRetryMethods
        if (retryConfig.hasKey("retryMethods")) {
            retryMethods = (retryConfig.getArray("retryMethods")!!.toArrayList() as ArrayList<String>).toSet()
        }

        var retryStatusCodes = RetryInterceptor.defaultRetryStatusCodes
        if (retryConfig.hasKey("statusCodes")) {
            retryStatusCodes = (retryConfig.getArray("statusCodes")!!.toArrayList() as ArrayList<Double>).map { code -> code.toInt() }.toSet()
        }

        var retryInterceptor: Interceptor? = null
        if (retryType == RetryTypes.LINEAR_RETRY) {
            var retryInterval = LinearRetryInterceptor.defaultRetryInterval
            if (retryConfig.hasKey("retryInterval")) {
                retryInterval = retryConfig.getDouble("retryInterval")!!
            }

            retryInterceptor = LinearRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, retryInterval)
        } else if (retryType == RetryTypes.EXPONENTIAL_RETRY) {
            var exponentialBackoffBase = ExponentialRetryInterceptor.defaultExponentialBackoffBase
            if (retryConfig.hasKey("exponentialBackoffBase")) {
                exponentialBackoffBase = retryConfig.getDouble("exponentialBackoffBase")!!
            }
            var exponentialBackoffScale = ExponentialRetryInterceptor.defaultExponentialBackoffScale
            if (retryConfig.hasKey("exponentialBackoffScale")) {
                exponentialBackoffScale = retryConfig.getDouble("exponentialBackoffScale")!!
            }

            retryInterceptor = ExponentialRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, exponentialBackoffBase, exponentialBackoffScale)
        }

        return retryInterceptor
    }

    private fun createClientTimeoutInterceptor(options: ReadableMap?): TimeoutInterceptor {
        var readTimeout = TimeoutInterceptor.defaultReadTimeout
        var writeTimeout = TimeoutInterceptor.defaultWriteTimeout

        if (options != null && options.hasKey("sessionConfiguration")) {
            val config = options.getMap("sessionConfiguration")!!
            if (config.hasKey("timeoutIntervalForRequest")) {
                readTimeout = config.getDouble("timeoutIntervalForRequest")!!.toInt()
            }
            if (config.hasKey("timeoutIntervalForRequest")) {
                writeTimeout = config.getDouble("timeoutIntervalForResource")!!.toInt()
            }
        }

        return TimeoutInterceptor(readTimeout, writeTimeout)
    }

    private fun createRequestTimeoutInterceptor(options: ReadableMap?): TimeoutInterceptor? {
        if (options != null && options.hasKey("timeoutInterval")) {
            val timeoutInterval = options.getDouble("timeoutInterval")
            return TimeoutInterceptor(timeoutInterval.toInt(), timeoutInterval.toInt())
        }

        return null
    }

    private fun applyBuilderOptions() {
        if (options != null && options.hasKey("sessionConfiguration")) {
            val config = options.getMap("sessionConfiguration")!!

            if (config.hasKey("followRedirects")) {
                val followRedirects = config.getBoolean("followRedirects")
                builder.followRedirects(followRedirects);
                builder.followSslRedirects(followRedirects);
            }

            if (config.hasKey("httpMaximumConnectionsPerHost")) {
                val maxConnections = config.getInt("httpMaximumConnectionsPerHost");
                val dispatcher = Dispatcher()
                dispatcher.maxRequests = maxConnections
                dispatcher.maxRequestsPerHost = maxConnections
                builder.dispatcher(dispatcher);
            }

            if (config.hasKey("enableCompression")) {
                builder.minWebSocketMessageToCompress(0);
            }
        }
    }
}
