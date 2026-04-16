package com.mattermost.networkclient

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.util.Base64
import android.webkit.CookieManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.mattermost.networkclient.enums.ApiClientEvents
import com.mattermost.networkclient.enums.RetryTypes
import com.mattermost.networkclient.enums.SslErrors
import com.mattermost.networkclient.helpers.DocumentHelper
import com.mattermost.networkclient.helpers.KeyStoreHelper
import com.mattermost.networkclient.helpers.UploadFileRequestBody
import com.mattermost.networkclient.interceptors.*
import com.mattermost.networkclient.interfaces.RetryInterceptor
import com.mattermost.networkclient.metrics.MetricsEventFactory
import com.mattermost.networkclient.metrics.RequestMetadata
import com.mattermost.networkclient.metrics.getNetworkType
import okhttp3.*
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.internal.EMPTY_REQUEST
import okhttp3.tls.HandshakeCertificates
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.net.URI
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.util.Locale
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.X509TrustManager
import kotlin.reflect.KProperty

const val CERTIFICATES_PATH = "certs"

internal class NetworkClient(private val context: Context, private val baseUrl: HttpUrl? = null, options: ReadableMap? = null, cookieJar: CookieJar? = null) {
    private var okHttpClient: OkHttpClient
    private var webSocketUri: URI? = null

    var clientHeaders: HashMap<String, Any?> = hashMapOf()
    var clientRetryInterceptor: Interceptor? = null
    lateinit var clientTimeoutInterceptor: TimeoutInterceptor
    val requestRetryInterceptors: HashMap<Request, Interceptor> = hashMapOf()
    val requestTimeoutInterceptors: HashMap<Request, TimeoutInterceptor> = hashMapOf()
    var webSocket: WebSocket? = null

    private var trustSelfSignedServerCertificate = false
    private val builder: OkHttpClient.Builder = OkHttpClient().newBuilder()
    private var shouldCollectMetrics: Boolean = false
    private var metricsEventFactory: MetricsEventFactory? = null

    private val baseUrlString = baseUrl.toString().trimTrailingSlashes()
    private val baseUrlHash = baseUrlString.sha256()
    private val tokenAlias = "$baseUrlHash-TOKEN"
    private val p12Alias = "$baseUrlHash-P12"

    companion object RequestRetriesExhausted {
        private val requestRetriesExhausted: HashMap<Response, Boolean?> = hashMapOf()

        operator fun getValue(response: Response, property: KProperty<*>): Boolean? {
            return requestRetriesExhausted[response]
        }

        operator fun setValue(response: Response, property: KProperty<*>, value: Boolean?) {
            requestRetriesExhausted[response] = value
        }
    }

    constructor(context: ReactApplicationContext, webSocketUri: URI, baseUrl: HttpUrl, options: ReadableMap? = null) : this(context, baseUrl, options) {
        this.webSocketUri = webSocketUri
    }

    init {
        initCollectMetrics(options)

        if (shouldCollectMetrics) {
            builder.addNetworkInterceptor(CompressedResponseSizeInterceptor())
        }

        if (baseUrl == null) {
            applyGenericClientBuilderConfiguration()
        } else {
            applyClientBuilderConfiguration(options, cookieJar)
        }

        val fingerprintsMap = getCertificatesFingerPrints()
        if (fingerprintsMap.isNotEmpty()) {
            val pinner = CertificatePinner.Builder()
            for ((domain, fingerprints) in fingerprintsMap) {
                for (fingerprint in fingerprints) {
                    pinner.add(domain, "sha256/$fingerprint")
                }
            }
            val certificatePinner = pinner.build()
            builder.certificatePinner(certificatePinner)
        }

        if (metricsEventFactory != null) {
            builder.eventListenerFactory(metricsEventFactory!!)
        }

        okHttpClient = builder.build()
    }

    private fun initCollectMetrics(options: ReadableMap?) {
        if (options != null && options.hasKey("sessionConfiguration")) {
            val sessionConfiguration = options.getMap("sessionConfiguration")!!
            if (sessionConfiguration.hasKey("collectMetrics")) {
                shouldCollectMetrics = sessionConfiguration.getBoolean("collectMetrics")
                if (shouldCollectMetrics) {
                    metricsEventFactory = MetricsEventFactory()
                }
            }
        }
    }

    private fun applyGenericClientBuilderConfiguration() {
        builder.followRedirects(true)
        builder.followSslRedirects(true)
    }

    private fun applyClientBuilderConfiguration(options: ReadableMap?, cookieJar: CookieJar?) {
        setClientHeaders(options)
        setClientRetryInterceptor(options)
        setClientTimeoutInterceptor(options)

        builder.followRedirects(false)
        builder.followSslRedirects(false)
        builder.retryOnConnectionFailure(true)
        builder.addInterceptor(RuntimeInterceptor(this, "retry"))
        builder.addInterceptor(RuntimeInterceptor(this, "timeout"))

        val bearerTokenInterceptor = getBearerTokenInterceptor(options)
        if (bearerTokenInterceptor != null) {
            builder.addInterceptor(bearerTokenInterceptor)
        }

        val handshakeCertificates = buildHandshakeCertificates(options)
        if (handshakeCertificates != null) {
            val sslContext = SSLContext.getInstance("TLS")
            val trustManager = getTrustManager(handshakeCertificates.trustManager)
            val trustManagers = arrayOf(trustManager)
            sslContext.init(null, trustManagers, SecureRandom())

            builder.sslSocketFactory(
                    sslContext.socketFactory,
                    getTrustManager(handshakeCertificates.trustManager)
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
                dispatcher.maxRequests = maxConnections * 13
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
                clientHeaders[k] = v as String
            }
        }
    }

    fun importClientP12AndRebuildClient(p12FilePath: String, password: String) {
        importClientP12(p12FilePath, password)

        val handshakeCertificates = buildHandshakeCertificates()
        if (handshakeCertificates != null) {
            val sslContext = SSLContext.getInstance("TLS")
            val trustManager = getTrustManager(handshakeCertificates.trustManager)
            val trustManagers = arrayOf(trustManager)
            sslContext.init(null, trustManagers, SecureRandom())

            okHttpClient = okHttpClient.newBuilder()
                    .sslSocketFactory(
                            sslContext.socketFactory,
                            getTrustManager(handshakeCertificates.trustManager)
                    )
                    .hostnameVerifier {hostname, session ->
                        val hv = HttpsURLConnection.getDefaultHostnameVerifier()
                        val result = hv.verify(hostname, session)
                        if (!result) {
                            emitInvalidCertificateError()
                        }
                        result
                    }
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
        call.enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                metricsEventFactory?.removeMetadata(call)
                if (e is javax.net.ssl.SSLPeerUnverifiedException) {
                    cancelAllRequests()
                    val fingerPrintsMap = getCertificatesFingerPrints()
                    if (fingerPrintsMap.containsKey(request.url.host)) {
                        emitInvalidPinnedCertificateError()
                        promise.reject(Exception("Server trust evaluation failed due to reason: Certificate pinning failed for host ${request.url.host}"))
                        return
                    } else {
                        rejectInvalidCertificate(promise, request.url.host)
                        return
                    }
                }
                promise.reject(e)
            }

            override fun onResponse(call: Call, response: Response) {
                var metadata: RequestMetadata? = null
                if (shouldCollectMetrics) {
                    metadata = metricsEventFactory?.getMetadata(call)
                    metadata?.networkType = getNetworkType(context)
                    metricsEventFactory?.removeMetadata(call)
                }
                promise.resolve(response.toWritableMap(metadata))
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

        return okHttpClient.newCall(request).execute()
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
        var requestHeaders: Map<String, Any?>? = null
        var multipartOptions: ReadableMap? = null
        var skipBytes: Long = 0

        if (options != null) {
            if (options.hasKey("method")) {
                method = options.getString("method")!!
            }

            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")?.toHashMap()
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
        var requestHeaders: Map<String, Any?>? = null

        if (options != null) {
            if (options.hasKey("method")) {
                method = options.getString("method")!!
            }

            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")?.toHashMap()
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
        ApiClientModuleImpl.deleteValue(tokenAlias)
        ApiClientModuleImpl.deleteValue(p12Alias)
        KeyStoreHelper.deleteClientCertificates(p12Alias)
    }

    private fun prepareRequestHeaders(options: ReadableMap?): Map<String, Any?>? {
        var requestHeaders: Map<String, Any?>? = null

        if (options != null) {
            if (options.hasKey("headers")) {
                requestHeaders = options.getMap("headers")?.toHashMap()
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
                        val jsonBody = (options.getMap("body")!!.toHashMap() as Map<*, *>?)?.let {
                            JSONObject(
                                it
                            )
                        }
                        requestBody = jsonBody?.toString()?.toRequestBody()
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

    private fun buildRequest(method: String, endpoint: String, headers: Map<String, Any?>?, body: RequestBody?): Request {
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

    private fun setClientHeaders(options: ReadableMap?) {
        if (options != null && options.hasKey(("headers"))) {
            addClientHeaders(options.getMap("headers")?.toWritableMap())
        }
    }

    private fun getBearerTokenInterceptor(options: ReadableMap?): BearerTokenInterceptor? {
        if (options != null && options.hasKey("requestAdapterConfiguration")) {
            val requestAdapterConfiguration = options.getMap("requestAdapterConfiguration")!!
            if (requestAdapterConfiguration.hasKey("bearerAuthTokenResponseHeader")) {
                val bearerAuthTokenResponseHeader = requestAdapterConfiguration.getString("bearerAuthTokenResponseHeader")!!
                return BearerTokenInterceptor(tokenAlias, bearerAuthTokenResponseHeader)
            }
        }

        return null
    }

    @SuppressLint("CustomX509TrustManager")
    private fun getTrustManager(defaultTrustManager: X509TrustManager): X509TrustManager {
        return object : X509TrustManager {
            @Throws(CertificateException::class)
            override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
                defaultTrustManager.checkClientTrusted(chain, authType)
            }

            @Throws(CertificateException::class)
            override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
                try {
                    defaultTrustManager.checkServerTrusted(chain, authType)
                } catch (ce: CertificateException) {
                    emitInvalidCertificateError()
                    throw ce
                }
            }

            override fun getAcceptedIssuers(): Array<X509Certificate> {
                return defaultTrustManager.acceptedIssuers
            }
        }
    }

    internal fun emitInvalidCertificateError() {
        val data = Arguments.createMap()
        data.putString("serverUrl", baseUrlString)
        data.putInt("errorCode", -299)
        data.putString("errorDescription", "The certificate for this server is invalid.\nYou might be connecting to a server that is pretending to be “${URI(baseUrlString).host}” which could put your confidential information at risk.")
        ApiClientModuleImpl.sendJSEvent(ApiClientEvents.CLIENT_ERROR.event, data)
    }

    internal fun emitInvalidPinnedCertificateError() {
        val data = Arguments.createMap()
        data.putString("serverUrl", baseUrlString)
        data.putInt("errorCode", SslErrors.SERVER_TRUST_EVALUATION_FAILED.event)
        data.putString("errorDescription", "Server trust evaluation failed due to reason: Certificate pinning failed for host ${URI(baseUrlString).host}")
        ApiClientModuleImpl.sendJSEvent(ApiClientEvents.CLIENT_ERROR.event, data)
    }

    private fun buildHandshakeCertificates(options: ReadableMap?): HandshakeCertificates? {
        if (options != null) {
            // `trustSelfSignedServerCertificate` can be in `options.sessionConfiguration` for
            // an APIClient or just in `options` for a WebSocketClient
            if (options.hasKey("sessionConfiguration")) {
                val sessionConfiguration = options.getMap("sessionConfiguration")!!
                if (sessionConfiguration.hasKey("trustSelfSignedServerCertificate") &&
                        sessionConfiguration.getBoolean("trustSelfSignedServerCertificate")) {
                    trustSelfSignedServerCertificate = true
                    builder.hostnameVerifier { _, _ -> true }
                } else {
                    buildHostnameVerifier()
                }
            } else if (options.hasKey("trustSelfSignedServerCertificate") &&
                    options.getBoolean("trustSelfSignedServerCertificate")) {
                trustSelfSignedServerCertificate = true
                builder.hostnameVerifier { _, _ -> true }
            } else {
                buildHostnameVerifier()
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
                    data.putString("serverUrl", baseUrlString)
                    data.putString("errorDescription", error.localizedMessage)
                    ApiClientModuleImpl.sendJSEvent(ApiClientEvents.CLIENT_ERROR.event, data)
                }
            }
        }

        return buildHandshakeCertificates()
    }

    private fun buildHostnameVerifier() {
        builder.hostnameVerifier {hostname, session ->
            val hv = HttpsURLConnection.getDefaultHostnameVerifier()
            val result = hv.verify(hostname, session)
            if (!result) {
                emitInvalidCertificateError()
            }
            result
        }
    }

    private fun buildHandshakeCertificates(): HandshakeCertificates? {
        if (baseUrl == null)
            return null

        val (heldCertificate, intermediates) = KeyStoreHelper.getClientCertificates(p12Alias)

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
        val realPath = DocumentHelper.getInstance().getRealPath(context, contentUri)
        if (!realPath.isNullOrEmpty()) {
            KeyStoreHelper.importClientCertificateFromP12(realPath, password, p12Alias)
        }
    }

    private fun setClientRetryInterceptor(options: ReadableMap?) {
        clientRetryInterceptor = createRetryInterceptor(options)
    }

    private fun setClientTimeoutInterceptor(options: ReadableMap?) {
        var readTimeout = TimeoutInterceptor.DEFAULT_READ_TIMEOUT
        var writeTimeout = TimeoutInterceptor.DEFAULT_WRITE_TIMEOUT

        if (options != null && options.hasKey("sessionConfiguration")) {
            val config = options.getMap("sessionConfiguration")!!
            if (config.hasKey("timeoutIntervalForRequest")) {
                try {
                    config.getDouble("timeoutIntervalForRequest").toInt().also { readTimeout = it }
                } catch (e: Exception) {
                    readTimeout = 0
                }
            }
            if (config.hasKey("timeoutIntervalForRequest")) {
                try {
                    config.getDouble("timeoutIntervalForResource").toInt().also { writeTimeout = it }
                } catch (e: Exception) {
                    writeTimeout = 0
                }
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

        val retryType = RetryTypes.entries.find { r -> r.type == retryConfig.getString("type") }
                ?: return null

        var retryLimit = RetryInterceptor.DEFAULT_RETRY_LIMIT
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
            val codes = retryConfig.getArray("statusCodes")?.let { it.toArrayList().map { code -> (code as Number).toInt() } }?.toSet()
            if (codes != null) {
                retryStatusCodes = codes
            }
        }

        var retryInterceptor: Interceptor? = null
        if (retryType == RetryTypes.LINEAR_RETRY) {
            var retryInterval = LinearRetryInterceptor.DEFAULT_RETRY_INTERVAL
            if (retryConfig.hasKey("retryInterval")) {
                retryInterval = retryConfig.getDouble("retryInterval")
            }

            retryInterceptor = LinearRetryInterceptor(retryLimit, retryStatusCodes, retryMethods, retryInterval)
        } else if (retryType == RetryTypes.EXPONENTIAL_RETRY) {
            var exponentialBackoffBase = ExponentialRetryInterceptor.DEFAULT_EXPONENTIAL_BACKOFF_BASE
            if (retryConfig.hasKey("exponentialBackoffBase")) {
                exponentialBackoffBase = retryConfig.getDouble("exponentialBackoffBase")
            }
            var exponentialBackoffScale = ExponentialRetryInterceptor.DEFAULT_EXPONENTIAL_BACKOFF_SCALE
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

    private fun getCertificateFingerPrint(certInputStream: InputStream): String {
        val certFactory = CertificateFactory.getInstance("X.509")
        val certificate = certFactory.generateCertificate(certInputStream) as X509Certificate
        val sha256 = MessageDigest.getInstance("SHA-256")
        val fingerprintBytes = sha256.digest(certificate.publicKey.encoded)
        return Base64.encodeToString(fingerprintBytes, Base64.NO_WRAP)
    }

    private fun getCertificatesFingerPrints(): Map<String, List<String>> {
        val fingerprintsMap = mutableMapOf<String, MutableList<String>>()
        val assetsManager = context.assets
        val certFiles = assetsManager.list(CERTIFICATES_PATH)?.filter { it.endsWith(".cer") || it.endsWith(".crt") } ?: return emptyMap()

        for (fileName in certFiles) {
            val file = File(fileName).normalize()
            val domain = file.nameWithoutExtension
            if (baseUrl != null && baseUrl.host != domain) {
                continue
            }
            val certInputStream = assetsManager.open("$CERTIFICATES_PATH/${file.name}")
            certInputStream.use {
                val fingerprint = getCertificateFingerPrint(it)
                if (fingerprintsMap.containsKey(domain)) {
                    fingerprintsMap[domain]?.add(fingerprint)
                } else {
                    fingerprintsMap[domain] = mutableListOf(fingerprint)
                }
            }
        }

        return fingerprintsMap
    }

    private fun rejectInvalidCertificate(promise: Promise, host: String) {
        emitInvalidCertificateError()
        promise.reject(Exception("The certificate for this server is invalid.\nYou might be connecting to a server that is pretending to be “${host}” which could put your confidential information at risk."))
    }
}
