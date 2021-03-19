package com.mattermost.networkclient.helpers

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mattermost.networkclient.interceptors.*
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.tls.HandshakeCertificates
import org.json.JSONObject
import java.io.FileInputStream
import java.security.KeyStore
import java.security.cert.X509Certificate
import java.util.*
import java.util.concurrent.TimeUnit
import javax.net.ssl.KeyManagerFactory

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
fun Request.Builder.parseOptions(options: ReadableMap?, session: OkHttpClient.Builder): Request.Builder {
    // Need to always close the connection once finished
    this.header("Connection", "close")

    if(options == null) return this;

    // Timeout Interval per request
    if (options.hasKey("timeoutInterval")) {
        session.addInterceptor(TimeoutRequestInterceptor(options.getInt("timeoutInterval")))
    }

    // Headers
    if (options.hasKey("headers")) {
        this.addHeadersAsReadableMap(options.getMap("headers")!!)
    }

    return this;
}

/**
 * Parses options passed in over the bridge for client sessions
 *
 * @params options ReadableMap of options from the App
 */
fun OkHttpClient.Builder.parseOptions(options: ReadableMap?, request: Request.Builder?): OkHttpClient.Builder {
    if(options == null) return this;

    // Retries off by default
    this.retryOnConnectionFailure(false);

    // Set retry policy if provided
    if (options.hasKey("retryPolicyConfiguration")) {
        val retryPolicyConfiguration = options.getMap("retryPolicyConfiguration")!!.toHashMap();
        val retryType = retryPolicyConfiguration["type"] as String?
        val retryLimit = retryPolicyConfiguration["retryLimit"] as Double?
        val retryExponentialBackoffBase = retryPolicyConfiguration["exponentialBackoffBase"] as Double?
        val retryExponentialBackoffScale = retryPolicyConfiguration["exponentialBackoffScale"] as Double?
        this.addInterceptor(RetryInterceptor(retryType, retryLimit?.toInt(), retryExponentialBackoffBase, retryExponentialBackoffScale))
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
            this.connectTimeout(sessionConfig.getInt("timeoutIntervalForRequest").toLong(), TimeUnit.SECONDS)
            this.readTimeout(sessionConfig.getInt("timeoutIntervalForRequest").toLong(), TimeUnit.SECONDS)
        }

        if (sessionConfig.hasKey("timeoutIntervalForResource")) {
            this.callTimeout(sessionConfig.getInt("timeoutIntervalForResource").toLong(), TimeUnit.SECONDS)
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

    // Request Adapter Config
    if(options.hasKey("requestAdapterConfiguration")){
        val requestAdapterConfiguration = options.getMap("requestAdapterConfiguration")!!;
        if(requestAdapterConfiguration.hasKey("bearerAuthTokenResponseHeader")){
            val bearerAuthTokenResponseHeader = requestAdapterConfiguration.getString("bearerAuthTokenResponseHeader")!!
            this.addInterceptor(BearerTokenInterceptor(bearerAuthTokenResponseHeader))
        }
    }

    // Client Cert Config
    if(options.hasKey("clientP12Configuration")){
        val clientP12Configuration = options.getMap("clientP12Configuration")!!;

        // Get our Cert
        val path = clientP12Configuration.getString("path")!!;
        val password = if(clientP12Configuration.hasKey("password")) {
            clientP12Configuration.getString("password")!!
        } else {
            ""
        }

        // Save P12 into KeyStore
        val aliases = getAndSaveCertsFromP12(path, password)

        // Use it for our Client
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null, null)

        // Certificates Builder
        val certificatesBuilder = HandshakeCertificates
                .Builder()
                .addPlatformTrustedCertificates()

        // Get all the saved certificates from KeyStore
        while(aliases.hasMoreElements()){
            val alias = aliases.nextElement() as String
            val cert: X509Certificate = keyStore.getCertificate(alias) as X509Certificate
            certificatesBuilder.addTrustedCertificate(cert)
        }

        // Build our certificates and attach them to the client
        val certificates = certificatesBuilder.build()
        this.sslSocketFactory(certificates.sslSocketFactory(), certificates.trustManager)
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
fun formUrlString(baseUrl: String, endpoint: String): String{
    return baseUrl.toHttpUrlOrNull()!!.newBuilder().addPathSegments(endpoint.trim { c -> c == '/' }).build().toString()
}

/**
 * Emit an event to the JS Application
 *
 * @param reactContext
 * @param eventName
 * @param params
 */
fun emitEvent(reactContext: ReactContext, eventName: String, params: Any){
    reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, params)
}

/**
 * Get's the certificates from a P12 File, and saves them in the AndroidKeyStore
 *
 * @param pathToFile
 * @param password
 */
private fun getAndSaveCertsFromP12(pathToFile: String, password: String): Enumeration<String> {
    val aliases: Enumeration<String>;
    try {
        // Get an instance of the AndroidKeyStore
        val androidKeyStore: KeyStore = KeyStore.getInstance("AndroidKeyStore")
        androidKeyStore.load(null)

        // Create an instance of a pkcs12 keystore
        val keyStore: KeyStore = KeyStore.getInstance("pkcs12")

        // Load our certificate file into it, with the password
        keyStore.load(FileInputStream(pathToFile), password.toCharArray())

        // Get all the key aliases
        aliases = keyStore.aliases()

        // Loop through them
        while (aliases.hasMoreElements()) {
            val alias = aliases.nextElement() as String
            val cert: X509Certificate = keyStore.getCertificate(alias) as X509Certificate

            // Add the certificate to the KeyStore
            androidKeyStore.setCertificateEntry(alias, cert)
        }
    } catch (e: Exception) {
        throw e;
    }

    return aliases;
}
