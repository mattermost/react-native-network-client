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
import kotlin.reflect.KProperty

class NetworkClient(private val baseUrl: HttpUrl? = null, private val options: ReadableMap?) {

    var okHttpClient: OkHttpClient
    var webSocket: WebSocket? = null
    var clientHeaders: WritableMap = options?.getMap("headers") as? WritableMap ?: Arguments.createMap()
    var clientRetryInterceptor: Interceptor? = null
    var clientTimeoutInterceptor: TimeoutInterceptor
    val requestRetryInterceptors: HashMap<Request, Interceptor> = hashMapOf()
    val requestTimeoutInterceptors: HashMap<Request, TimeoutInterceptor> = hashMapOf()
    private val builder: OkHttpClient.Builder = OkHttpClient().newBuilder()

    companion object RequestRetriesExhausted {
        private val retriesExhausted: HashMap<Response, Boolean?> = hashMapOf()

        operator fun getValue(response: Response, property: KProperty<*>): Boolean? {
            return retriesExhausted[response]
        }

        operator fun setValue(response: Response, property: KProperty<*>, value: Boolean?) {
            retriesExhausted[response] = value
        }
    }

    init {
        clientRetryInterceptor = createRetryInterceptor(options)
        clientTimeoutInterceptor = createClientTimeoutInterceptor()

        builder.retryOnConnectionFailure(false);
        builder.addInterceptor(RuntimeInterceptor(this, "retry"))
        builder.addInterceptor(RuntimeInterceptor(this, "timeout"))
        applyBuilderOptions()

        okHttpClient = builder.build()
    }

    fun addHeaders(additionalHeaders: ReadableMap?) {
        if (additionalHeaders != null) {
            for ((k, v) in additionalHeaders.toHashMap()) {
                clientHeaders.putString(k, v as String)
            }
        }
    }

    fun request(method: String, endpoint: String, options: ReadableMap?): Response {
        val requestHeaders = options?.getMap("headers")
        val requestBody = options?.getMap("body")?.bodyToRequestBody()

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
        requestRetryInterceptors.remove(response.request)
        requestTimeoutInterceptors.remove(response.request)
    }

    fun buildUploadCall(endpoint: String, fileUri: Uri, fileBody: RequestBody, options: ReadableMap?): Call {
        val multipartOptions = options?.getMap("multipart")
        val requestBody = if (multipartOptions != null) {
            buildMultipartBody(fileUri, fileBody, multipartOptions)
        } else {
            fileBody
        }

        val method = options?.getString("method") ?: "POST"
        val requestHeaders = options?.getMap("headers")
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
                .header("Connection", "close")
                .method(method, body)
                .build();
    }

    private fun buildMultipartBody(uri: Uri, fileBody: RequestBody, multipartOptions: ReadableMap): RequestBody {
        val multipartBody = MultipartBody.Builder();
        multipartBody.setType(MultipartBody.FORM)

        var name = multipartOptions.getString("fileKey")
        if (name == null || name.isBlank()) {
            name = "files"
        }
        if (multipartOptions.hasKey("fileKey") && multipartOptions.getString("fileKey") != "") {
            multipartBody.addFormDataPart(name, uri.lastPathSegment, fileBody)
        } else {
            multipartBody.addFormDataPart(name, uri.lastPathSegment, fileBody)
        }

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

    private fun createRetryInterceptor(options: ReadableMap?): Interceptor? {
        val retryConfig = options?.getMap("retryPolicyConfiguration")
                ?: return null

        val retryType = RetryTypes.values().find { r -> r.type == retryConfig.getString("type") }
                ?: return null

        val retryLimit = retryConfig.getDouble("retryLimit")

        var retryMethods = setOf("get", "patch", "post", "put", "delete")
        if (retryConfig.hasKey("retryMethods") && retryConfig.getArray("retryMethods") != null) {
            retryMethods = (retryConfig.getArray("retryMethods")!!.toArrayList() as ArrayList<String>).toSet()
        }

        var retryStatusCodes = setOf(408, 500, 502, 503, 504)
        if (retryConfig.hasKey("statusCodes") && retryConfig.getArray("statusCodes") != null) {
            retryStatusCodes = (retryConfig.getArray("statusCodes")!!.toArrayList() as ArrayList<Double>).map { code -> code.toInt() }.toSet()
        }

        var retryInterceptor: Interceptor? = null
        if (retryType == RetryTypes.LINEAR_RETRY) {
            val retryInterval = retryConfig.getDouble("retryInterval")
            retryInterceptor = LinearRetryInterceptor(retryLimit, retryInterval, retryStatusCodes, retryMethods)
        } else if (retryType == RetryTypes.EXPONENTIAL_RETRY) {
            val exponentialBackOffBase = retryConfig.getDouble("exponentialBackoffBase")
            val exponentialBackOffScale = retryConfig.getDouble("exponentialBackoffScale")
            retryInterceptor = ExponentialRetryInterceptor(retryLimit, exponentialBackOffBase, exponentialBackOffScale, retryStatusCodes, retryMethods)
        }

        return retryInterceptor
    }

    private fun createClientTimeoutInterceptor(): TimeoutInterceptor {
        var readTimeout = options?.getDouble("timeoutIntervalForRequest") ?: 300.0
        var writeTimeout = options?.getDouble("timeoutIntervalForResource") ?: 300.0

        return TimeoutInterceptor(readTimeout.toInt(), writeTimeout.toInt())
    }

    private fun createRequestTimeoutInterceptor(options: ReadableMap?): TimeoutInterceptor? {
        val timeoutInterval = options?.getDouble("timeoutInterval")
        if (timeoutInterval != null) {
            return TimeoutInterceptor(timeoutInterval.toInt(), timeoutInterval.toInt())
        }

        return null
    }

    private fun applyBuilderOptions() {
        if (options != null) {
            if (options.hasKey("sessionConfiguration")) {
                val config = options.getMap("sessionConfiguration")!!;

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

                // WS: Compression
                if (config.hasKey("enableCompression")) {
                    builder.minWebSocketMessageToCompress(0);
                }
            }
        }
    }
}
