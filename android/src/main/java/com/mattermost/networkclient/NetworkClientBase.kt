package com.mattermost.networkclient

import android.net.Uri
import android.webkit.CookieManager
import com.facebook.react.bridge.*
import com.mattermost.networkclient.enums.APIClientEvents
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.helpers.DocumentHelper
import com.mattermost.networkclient.helpers.KeyStoreHelper
import com.mattermost.networkclient.helpers.UploadFileRequestBody
import com.mattermost.networkclient.interceptors.*
import com.mattermost.networkclient.interfaces.RetryInterceptor
import okhttp3.*
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.internal.EMPTY_REQUEST
import okhttp3.tls.HandshakeCertificates
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.URI
import java.util.*
import kotlin.collections.ArrayList
import kotlin.collections.HashMap
import kotlin.reflect.KProperty

internal open class NetworkClientBase(private val baseUrl: HttpUrl? = null) {
    lateinit var okHttpClient: OkHttpClient
    internal var webSocketUri: URI? = null
    var webSocket: WebSocket? = null
    var clientHeaders: WritableMap = Arguments.createMap()
    var clientRetryInterceptor: Interceptor? = null
    lateinit var clientTimeoutInterceptor: TimeoutInterceptor
    val requestRetryInterceptors: HashMap<Request, Interceptor> = hashMapOf()
    val requestTimeoutInterceptors: HashMap<Request, TimeoutInterceptor> = hashMapOf()
    private var trustSelfSignedServerCertificate = false
    val builder: OkHttpClient.Builder = OkHttpClient().newBuilder()

    private val BASE_URL_STRING = baseUrl.toString().trimTrailingSlashes()
    private val BASE_URL_HASH = BASE_URL_STRING.sha256()
    private val TOKEN_ALIAS = "$BASE_URL_HASH-TOKEN"
    private val P12_ALIAS = "$BASE_URL_HASH-P12"

    companion object RequestRetriesExhausted {
        private val requestRetriesExhausted: HashMap<Response, Boolean?> = hashMapOf()

        operator fun getValue(response: Response, property: KProperty<*>): Boolean? {
            return requestRetriesExhausted[response]
        }

        operator fun setValue(response: Response, property: KProperty<*>, value: Boolean?) {
            requestRetriesExhausted[response] = value
        }
    }

    protected open fun applyGenericClientBuilderConfiguration() {
        builder.followRedirects(true)
        builder.followSslRedirects(true)
    }

    protected open fun applyClientBuilderConfiguration(options: ReadableMap?, cookieJar: CookieJar?) {
        setClientHeaders(options)
        setClientRetryInterceptor(options)
        setClientTimeoutInterceptor(options)

        builder.followRedirects(false)
        builder.followSslRedirects(false)
        builder.retryOnConnectionFailure(false)
        builder.addInterceptor(RuntimeInterceptor(this as NetworkClient, "retry"))
        builder.addInterceptor(RuntimeInterceptor(this, "timeout"))

        val bearerTokenInterceptor = getBearerTokenInterceptor(options)
        if (bearerTokenInterceptor != null) {
            builder.addInterceptor(bearerTokenInterceptor)
        }

        val handshakeCertificates = buildHandshakeCertificates(options)
        if (handshakeCertificates != null) {
            builder.sslSocketFactory(
                    handshakeCertificates.sslSocketFactory(),
                    handshakeCertificates.trustManager
            )
        }

        if (cookieJar != null) {
            builder.cookieJar(cookieJar)
        }

        if (options != null && options.hasKey("sessionConfiguration")) {
            val config = options.getMap("sessionConfiguration")!!

            if (config.hasKey("httpMaximumConnectionsPerHost")) {
                val maxConnections = config.getInt("httpMaximumConnectionsPerHost")
                val dispatcher = Dispatcher()
                dispatcher.maxRequests = maxConnections
                dispatcher.maxRequestsPerHost = maxConnections
                builder.dispatcher(dispatcher)
            }

            if (config.hasKey("enableCompression")) {
                builder.minWebSocketMessageToCompress(0)
            }
        }
    }

    fun addClientHeaders(additionalHeaders: ReadableMap?) {
        if (additionalHeaders != null) {
            for ((k, v) in additionalHeaders.toHashMap()) {
                clientHeaders.putString(k, v as String)
            }
        }
    }

    fun importClientP12AndRebuildClient(p12FilePath: String, password: String) {
        importClientP12(p12FilePath, password)

        val handshakeCertificates = buildHandshakeCertificates()
        if (handshakeCertificates != null) {
            okHttpClient = okHttpClient.newBuilder()
                    .sslSocketFactory(
                            handshakeCertificates.sslSocketFactory(),
                            handshakeCertificates.trustManager
                    )
                    .build()
        }
    }

    fun request(method: String, endpoint: String, options: ReadableMap?, promise: Promise) {
        val requestHeaders = prepareRequestHeaders(options)
        val requestBody = prepareRequestBody(method, options)
        val request = buildRequest(method, endpoint, requestHeaders, requestBody)

        val timeoutInterceptor = createRequestTimeoutInterceptor(options)
        if (timeoutInterceptor != null) {
            requestTimeoutInterceptors[request] = timeoutInterceptor
        }

        val retryInterceptor = createRetryInterceptor(options, request)
        if (retryInterceptor != null) {
            requestRetryInterceptors[request] = retryInterceptor
        }

        val call = okHttpClient.newCall(request)
        call.enqueue(object : okhttp3.Callback {
            override fun onFailure(call: Call, e: IOException) {
                promise.reject(e)
            }

            override fun onResponse(call: Call, response: Response) {
                promise.resolve(response.toWritableMap())
                cleanUpAfter(response)
            }
        })
    }

    fun requestSync(method: String, endpoint: String, options: ReadableMap?): Response {
        val requestHeaders = prepareRequestHeaders(options)
        val requestBody = prepareRequestBody(method, options)
        val request = buildRequest(method, endpoint, requestHeaders, requestBody)

        val timeoutInterceptor = createRequestTimeoutInterceptor(options)
        if (timeoutInterceptor != null) {
            requestTimeoutInterceptors[request] = timeoutInterceptor
        }

        val retryInterceptor = createRetryInterceptor(options, request)
        if (retryInterceptor != null) {
            requestRetryInterceptors[request] = retryInterceptor
        }

        return okHttpClient.newCall(request).execute();
    }

    fun adaptRCTRequest(request: Request): Call {
        val newRequest = request
                .newBuilder()
                .applyHeaders(clientHeaders)
                .build()

        return okHttpClient.newCall(newRequest)
    }

    fun cleanUpAfter(response: Response) {
        requestRetriesExhausted.remove(response)
        requestRetryInterceptors.remove(response.request)
        requestTimeoutInterceptors.remove(response.request)
    }

    fun buildUploadCall(endpoint: String, filePath: String, taskId: String, options: ReadableMap?): Call {
        var method = "POST"
        var requestHeaders: ReadableMap? = null
        var multipartOptions: ReadableMap? = null
        var skipBytes: Long = 0

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

            if (options.hasKey("skipBytes")) {
                skipBytes = options.getInt("skipBytes").toLong()
            }
        }

        val fileUri = Uri.parse(filePath)
        val fileBody = UploadFileRequestBody(fileUri, skipBytes, taskId)


        val requestBody = if (multipartOptions != null) {
            buildMultipartBody(fileUri, fileBody, multipartOptions)
        } else {
            fileBody
        }

        val request = buildRequest(method, endpoint, requestHeaders, requestBody)

        val timeoutInterceptor = createRequestTimeoutInterceptor(options)
        if (timeoutInterceptor != null) {
            requestTimeoutInterceptors[request] = timeoutInterceptor
        }

        return okHttpClient.newCall(request)
    }

    fun buildDownloadCall(endpoint: String, taskId: String, options: ReadableMap?): Call {
        var method = "GET"
        var requestHeaders: ReadableMap? = null

        if (options != null) {
            if (options.hasKey("method")) {
                method = options.getString("method")!!
            }

            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")
            }
        }


        val request = buildRequest(method, endpoint, requestHeaders, null)
        requestRetryInterceptors[request] = DownloadProgressInterceptor(taskId)

        val timeoutInterceptor = createRequestTimeoutInterceptor(options)
        if (timeoutInterceptor != null) {
            requestTimeoutInterceptors[request] = timeoutInterceptor
        }


        return okHttpClient.newCall(request)
    }

    fun createWebSocket() {
        val request = Request.Builder()
                .url(webSocketUri.toString())
                .applyHeaders(clientHeaders)
                .build()
        val listener = WebSocketEventListener(webSocketUri!!)

        webSocket = okHttpClient.newWebSocket(request, listener)
    }

    fun invalidate() {
        cancelAllRequests()
        clearCache()
        clearCookies()
        APIClientModule.deleteValue(TOKEN_ALIAS)
        APIClientModule.deleteValue(P12_ALIAS)
        KeyStoreHelper.deleteClientCertificates(P12_ALIAS)
    }

    private fun prepareRequestHeaders(options: ReadableMap?): ReadableMap? {
        var requestHeaders: ReadableMap? = null

        if (options != null) {
            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")
            }
        }

        return requestHeaders
    }
    private fun prepareRequestBody(method: String, options: ReadableMap?): RequestBody? {
        var requestBody: RequestBody? = null

        if (options != null) {
            if (options.hasKey("body")) {
                when (options.getType("body")) {
                    ReadableType.Array -> {
                        val jsonBody = JSONArray(options.getArray("body")!!.toArrayList())
                        requestBody = jsonBody.toString().toRequestBody()
                    }
                    ReadableType.Map -> {
                        val jsonBody = JSONObject(options.getMap("body")!!.toHashMap())
                        requestBody = jsonBody.toString().toRequestBody()
                    }
                    ReadableType.String -> {
                        requestBody = options.getString("body")!!.toRequestBody()
                    }
                    ReadableType.Null -> {
                        requestBody = EMPTY_REQUEST
                    }
                    ReadableType.Boolean -> {
                        requestBody = options.getBoolean("body").toString().toRequestBody()
                    }
                    ReadableType.Number -> {
                        requestBody = options.getDouble("body").toString().toRequestBody()
                    }
                }
            } else if (method.uppercase(Locale.ENGLISH) == "POST") {
                requestBody = EMPTY_REQUEST
            }
        }

        return requestBody
    }

    private fun buildRequest(method: String, endpoint: String, headers: ReadableMap?, body: RequestBody?): Request {
        return Request.Builder()
                .url(composeEndpointUrl(endpoint))
                .applyHeaders(clientHeaders)
                .applyHeaders(headers)
                .method(method.uppercase(Locale.ENGLISH), body)
                .build()
    }

    private fun buildMultipartBody(uri: Uri, fileBody: RequestBody, multipartOptions: ReadableMap): RequestBody {
        val multipartBody = MultipartBody.Builder()
        multipartBody.setType(MultipartBody.FORM)

        var name = "files"
        if (multipartOptions.hasKey("fileKey")) {
            name = multipartOptions.getString("fileKey")!!
        }
        multipartBody.addFormDataPart(name, uri.lastPathSegment, fileBody)

        if (multipartOptions.hasKey("data")) {
            val multipartData = multipartOptions.getMap("data")!!.toHashMap()
            for ((k, v) in multipartData) {
                multipartBody.addFormDataPart(k, v as String)
            }
        }

        return multipartBody.build()
    }

    private fun composeEndpointUrl(endpoint: String) : String {
        if (baseUrl == null) {
            return endpoint
        }

        val pathname = if (baseUrl.pathSegments.isNotEmpty()) baseUrl.pathSegments.joinToString("/") else ""

        return baseUrl
                .newBuilder(pathname + endpoint)?.build()
                .toString()
    }

    internal fun setClientHeaders(options: ReadableMap?) {
        if (options != null && options.hasKey(("headers"))) {
            addClientHeaders(options.getMap("headers"))
        }
    }

    internal fun getBearerTokenInterceptor(options: ReadableMap?): BearerTokenInterceptor? {
        if (options != null && options.hasKey("requestAdapterConfiguration")) {
            val requestAdapterConfiguration = options.getMap("requestAdapterConfiguration")!!
            if (requestAdapterConfiguration.hasKey("bearerAuthTokenResponseHeader")) {
                val bearerAuthTokenResponseHeader = requestAdapterConfiguration.getString("bearerAuthTokenResponseHeader")!!
                return BearerTokenInterceptor(TOKEN_ALIAS, bearerAuthTokenResponseHeader)
            }
        }

        return null
    }

    internal fun buildHandshakeCertificates(options: ReadableMap?): HandshakeCertificates? {
        if (options != null) {
            // `trustSelfSignedServerCertificate` can be in `options.sessionConfiguration` for
            // an APIClient or just in `options` for a WebSocketClient
            if (options.hasKey("sessionConfiguration")) {
                val sessionConfiguration = options.getMap("sessionConfiguration")!!
                if (sessionConfiguration.hasKey("trustSelfSignedServerCertificate") &&
                        sessionConfiguration.getBoolean("trustSelfSignedServerCertificate")) {
                    trustSelfSignedServerCertificate = true
                    builder.hostnameVerifier { _, _ -> true }
                }
            } else if (options.hasKey("trustSelfSignedServerCertificate") &&
                    options.getBoolean("trustSelfSignedServerCertificate")) {
                trustSelfSignedServerCertificate = true
                builder.hostnameVerifier { _, _ -> true }
            }

            if (options.hasKey("clientP12Configuration")) {
                val clientP12Configuration = options.getMap("clientP12Configuration")!!
                val path = clientP12Configuration.getString("path")!!
                val password = if (clientP12Configuration.hasKey("password")) {
                    clientP12Configuration.getString("password")!!
                } else {
                    ""
                }

                try {
                    importClientP12(path, password)
                } catch (error: Exception) {
                    val data = Arguments.createMap()
                    data.putString("serverUrl", BASE_URL_STRING)
                    data.putString("errorDescription", error.localizedMessage)
                    APIClientModule.sendJSEvent(APIClientEvents.CLIENT_ERROR.event, data)
                }
            }
        }

        return buildHandshakeCertificates()
    }

    private fun buildHandshakeCertificates(): HandshakeCertificates? {
        if (baseUrl == null)
            return null

        val (heldCertificate, intermediates) = KeyStoreHelper.getClientCertificates(P12_ALIAS)

        if (!trustSelfSignedServerCertificate && heldCertificate == null)
            return null

        val builder = HandshakeCertificates.Builder()
                .addPlatformTrustedCertificates()

        if (trustSelfSignedServerCertificate) {
            builder.addInsecureHost(baseUrl.host)
        }

        if (heldCertificate != null) {
            builder.heldCertificate(heldCertificate, *intermediates!!)
        }

        return builder.build()
    }

    /**
     * Gets the real path to the p12 file uses KeyStoreHelper to import
     * the key and certificates.
     *
     * @throws Exception from KeyStoreHelper.importClientCertificateFromP12
     * which we leave to the caller of this function to handle.
     */
    private fun importClientP12(p12FilePath: String, password: String) {
        val contentUri = Uri.parse(p12FilePath)
        val realPath = DocumentHelper.getRealPath(contentUri)
        KeyStoreHelper.importClientCertificateFromP12(realPath, password, P12_ALIAS)
    }

    internal fun setClientRetryInterceptor(options: ReadableMap?) {
        clientRetryInterceptor = createRetryInterceptor(options)
    }

    internal fun setClientTimeoutInterceptor(options: ReadableMap?) {
        var readTimeout = TimeoutInterceptor.defaultReadTimeout
        var writeTimeout = TimeoutInterceptor.defaultWriteTimeout

        if (options != null && options.hasKey("sessionConfiguration")) {
            val config = options.getMap("sessionConfiguration")!!
            if (config.hasKey("timeoutIntervalForRequest")) {
                readTimeout = config.getDouble("timeoutIntervalForRequest").toInt()
            }
            if (config.hasKey("timeoutIntervalForRequest")) {
                writeTimeout = config.getDouble("timeoutIntervalForResource").toInt()
            }
        }

        clientTimeoutInterceptor = TimeoutInterceptor(readTimeout, writeTimeout)
    }

    private fun createRetryInterceptor(options: ReadableMap?, request: Request? = null): Interceptor? {
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
            retryLimit = retryConfig.getDouble("retryLimit")
        }

        var retryMethods = RetryInterceptor.defaultRetryMethods
        if (request != null) {
            retryMethods = setOf(request.method.uppercase(Locale.ENGLISH))
        } else if (retryConfig.hasKey("retryMethods")) {
            retryMethods = retryConfig.getArray("retryMethods")!!
                    .toArrayList()
                    .map { (it as String).uppercase(Locale.ENGLISH) }
                    .toSet()
        }

        var retryStatusCodes = RetryInterceptor.defaultRetryStatusCodes
        if (retryConfig.hasKey("statusCodes")) {
            retryStatusCodes = (retryConfig.getArray("statusCodes")!!.toArrayList() as ArrayList<Double>).map { code -> code.toInt() }.toSet()
        }

        var retryInterceptor: Interceptor? = null
        if (retryType == RetryTypes.LINEAR_RETRY) {
            var retryInterval = LinearRetryInterceptor.defaultRetryInterval
            if (retryConfig.hasKey("retryInterval")) {
                retryInterval = retryConfig.getDouble("retryInterval")
            }

            retryInterceptor = LinearRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, retryInterval)
        } else if (retryType == RetryTypes.EXPONENTIAL_RETRY) {
            var exponentialBackoffBase = ExponentialRetryInterceptor.defaultExponentialBackoffBase
            if (retryConfig.hasKey("exponentialBackoffBase")) {
                exponentialBackoffBase = retryConfig.getDouble("exponentialBackoffBase")
            }
            var exponentialBackoffScale = ExponentialRetryInterceptor.defaultExponentialBackoffScale
            if (retryConfig.hasKey("exponentialBackoffScale")) {
                exponentialBackoffScale = retryConfig.getDouble("exponentialBackoffScale")
            }

            retryInterceptor = ExponentialRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, exponentialBackoffBase, exponentialBackoffScale)
        }

        return retryInterceptor
    }

    private fun createRequestTimeoutInterceptor(options: ReadableMap?): TimeoutInterceptor? {
        if (options != null && options.hasKey("timeoutInterval")) {
            val timeoutInterval = options.getDouble("timeoutInterval")
            return TimeoutInterceptor(timeoutInterval.toInt(), timeoutInterval.toInt())
        }

        return null
    }

    private fun cancelAllRequests() {
        okHttpClient.dispatcher.cancelAll()
    }

    private fun clearCache() {
        if (baseUrl == null)
            return

        val domain = baseUrl.toString()
        if (okHttpClient.cache != null) {
            val urlIterator = okHttpClient.cache!!.urls()
            while (urlIterator.hasNext()) {
                if (urlIterator.next().startsWith(domain)) {
                    urlIterator.remove()
                }
            }
        }
    }

    private fun clearCookies() {
        if (baseUrl == null)
            return

        val domain = baseUrl.toString()
        val cookieManager = CookieManager.getInstance()
        val cookieString = cookieManager.getCookie(domain) ?: return
        val cookies = cookieString.split(";").toTypedArray()
        for (i in cookies.indices) {
            val cookieParts = cookies[i].split("=").toTypedArray()
            cookieManager.setCookie(domain, cookieParts[0].trim { it <= ' ' } + "=; Expires=Thurs, 1 Jan 1970 12:00:00 GMT")
        }
    }
}
