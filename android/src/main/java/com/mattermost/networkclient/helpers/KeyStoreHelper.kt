package com.mattermost.networkclient.helpers

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.mattermost.networkclient.APIClientModule
import okhttp3.tls.HeldCertificate
import java.io.FileInputStream
import java.security.Key
import java.security.KeyPair
import java.security.KeyStore
import java.security.PrivateKey
import java.security.cert.Certificate
import java.security.cert.X509Certificate
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec


object KeyStoreHelper {
    private const val ANDROID_KEY_STORE_TYPE = "AndroidKeyStore"
    private const val ANDROID_KEY_ALIAS = "NetworkClientAndroidKeyStore"
    private lateinit var androidKeyStore: KeyStore
    private var androidKeyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEY_STORE_TYPE
    )

    private const val CIPHER_TRANSFORMATION = KeyProperties.KEY_ALGORITHM_AES +
            "/" + KeyProperties.BLOCK_MODE_CBC +
            "/" + KeyProperties.ENCRYPTION_PADDING_PKCS7

    private const val P12_KEY_ALIAS = "KEY"
    private const val P12_CERTIFICATE_ALIAS= "CERTIFICATE"

    init {
         loadAndroidKeyStore()
         generateAndroidKeyIfNeeded()
    }

    fun encryptData(data: String): String {
        var temp = data
        while (temp.toByteArray().size % 16 != 0) {
            temp += "\u0020"
        }

        val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getAndroidKey()!!)
        val ivBytes = cipher.iv
        val encryptedBytes = cipher.doFinal(temp.toByteArray(Charsets.UTF_8))

        return Base64.encodeToString(encryptedBytes, Base64.DEFAULT) +
                "," + Base64.encodeToString(ivBytes, Base64.DEFAULT)
    }

    fun decryptData(data: String): String {
        val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)
        val (encryptedData, ivData) = data.split(",")
        val spec = IvParameterSpec(Base64.decode(ivData, Base64.DEFAULT))
        cipher.init(Cipher.DECRYPT_MODE, getAndroidKey()!!, spec)

        return cipher.doFinal(Base64.decode(encryptedData, Base64.DEFAULT)).toString(Charsets.UTF_8).trim()
    }

    fun importClientCertificateFromP12(p12FilePath: String, password: String, p12Alias: String) {
        val p12Store = KeyStore.getInstance("PKCS12").apply {
            load(FileInputStream(p12FilePath), password.toCharArray())
        }
        val aliases = p12Store.aliases()
        while (aliases.hasMoreElements()) {
            val alias = aliases.nextElement()
            if (p12Store.isKeyEntry(alias)) {
                val key = p12Store.getKey(alias, password.toCharArray())
                val certificate = p12Store.getCertificate(alias)
                val intermediates = p12Store.getCertificateChain(alias)

                storeP12Contents(key, certificate, intermediates, password, p12Alias)

                break
            }
        }
    }

    fun getClientCertificates(p12Alias: String): Pair<HeldCertificate?, Array<X509Certificate>?> {
        val password = APIClientModule.retrieveValue(p12Alias)
        if (password != null) {
            val p12File = APIClientModule.context.openFileInput(p12Alias)
            val p12Store = KeyStore.getInstance("PKCS12").apply {
                load(p12File, password.toCharArray())
            }

            val keyAlias = getKeyEntryAlias(p12Alias)
            if (p12Store.containsAlias(keyAlias)) {
                val certificateAlias = getCertificateEntryAlias(p12Alias)

                val key = p12Store.getKey(keyAlias, null) as PrivateKey
                val certificate = p12Store.getCertificate(certificateAlias) as X509Certificate
                val heldCertificate = HeldCertificate(KeyPair(certificate.publicKey, key), certificate)

                val intermediates = p12Store.getCertificateChain(keyAlias)
                        .map { it as X509Certificate }
                        .toTypedArray()

                return Pair(heldCertificate, intermediates)
            }
        }

        return Pair(null, null)
    }

    fun deleteClientCertificates(p12Alias: String) {
        APIClientModule.context.deleteFile(p12Alias)
    }

    private fun loadAndroidKeyStore() {
        androidKeyStore = KeyStore.getInstance(ANDROID_KEY_STORE_TYPE).apply { load(null) }
    }

    private fun generateAndroidKeyIfNeeded() {
        if (getAndroidKey() == null) {
            val parameterSpec = KeyGenParameterSpec.Builder(
                    ANDROID_KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                    .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                    .setRandomizedEncryptionRequired(true)
                    .build()

            androidKeyGenerator.init(parameterSpec)
            androidKeyGenerator.generateKey()
        }
    }

    private fun getAndroidKey(): SecretKey? {
        if (!androidKeyStore.containsAlias(ANDROID_KEY_ALIAS))
            return null

        val secretKeyEntry = androidKeyStore.getEntry(ANDROID_KEY_ALIAS, null) as KeyStore.SecretKeyEntry
        return secretKeyEntry.secretKey
    }

    private fun getKeyEntryAlias(aliasPrefix: String): String {
        return "$aliasPrefix-$P12_KEY_ALIAS"
    }

    private fun getCertificateEntryAlias(aliasPrefix: String): String {
        return "$aliasPrefix-$P12_CERTIFICATE_ALIAS"
    }

    private fun storeP12Contents(key: Key, certificate: Certificate, intermediates: Array<Certificate>, password: String, p12Alias: String) {
        val p12Store = KeyStore.getInstance("PKCS12").apply {
            load(null)
        }

        val keyAlias = getKeyEntryAlias(p12Alias)
        val certificateAlias = getCertificateEntryAlias(p12Alias)
        p12Store.setKeyEntry(keyAlias, key, null, intermediates)
        p12Store.setCertificateEntry(certificateAlias, certificate)

        val p12File = APIClientModule.context.openFileOutput(p12Alias, Context.MODE_PRIVATE)
        p12Store.store(p12File, password.toCharArray())

        APIClientModule.storeValue(password, p12Alias)
    }
}
