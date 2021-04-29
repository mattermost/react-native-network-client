package com.mattermost.networkclient.helpers

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.io.FileInputStream
import java.security.KeyStore
import java.security.cert.Certificate
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec


object KeyStoreHelper {
    private const val KEY_STORE_TYPE = "AndroidKeyStore"
    private const val SECRET_KEY_ALIAS = "NetworkClientKeyStore"
    private const val CIPHER_TRANSFORMATION = KeyProperties.KEY_ALGORITHM_AES +
            "/" + KeyProperties.BLOCK_MODE_CBC +
            "/" + KeyProperties.ENCRYPTION_PADDING_PKCS7

    private lateinit var keyStore: KeyStore
    private var keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            KEY_STORE_TYPE
    )

    init {
        setAndLoadKeyStore()
        generateSecretKeyPairIfNeeded()
    }

    fun encryptData(data: String): String {
        var temp = data
        while (temp.toByteArray().size % 16 != 0) {
            temp += "\u0020"
        }

        val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey()!!)
        val ivBytes = cipher.iv
        val encryptedBytes = cipher.doFinal(temp.toByteArray(Charsets.UTF_8))

        return Base64.encodeToString(encryptedBytes, Base64.DEFAULT) +
                "," + Base64.encodeToString(ivBytes, Base64.DEFAULT)
    }

    fun decryptData(data: String): String {
        val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)
        val (encryptedData, ivData) = data.split(",")
        val spec = IvParameterSpec(Base64.decode(ivData, Base64.DEFAULT))
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey()!!, spec)

        return cipher.doFinal(Base64.decode(encryptedData, Base64.DEFAULT)).toString(Charsets.UTF_8).trim()
    }

    fun importCertificatesFromP12(p12FilePath: String, password: String, keyStoreAlias: String) {
        try {
            val p12 = KeyStore.getInstance("pkcs12")
            p12.load(FileInputStream(p12FilePath), password.toCharArray())
            val aliases = p12.aliases()
            while (aliases.hasMoreElements()) {
                val alias = aliases.nextElement()
                if (p12.isCertificateEntry(alias)) {
                    val certificate = p12.getCertificate(alias)
                    keyStore.setCertificateEntry(keyStoreAlias, certificate)

                    break
                }
            }
        } catch (e: Exception) {
            throw e
        }
    }

    fun getCertificate(alias: String): Certificate? {
        if (keyStore.containsAlias(alias)) {
            return keyStore.getCertificate(alias)
        }

        return null
    }

    private fun setAndLoadKeyStore() {
        keyStore = KeyStore.getInstance(KEY_STORE_TYPE)
        keyStore.load(null)
    }

    private fun generateSecretKeyPairIfNeeded() {
        if (getSecretKey() == null) {
            val parameterSpec = KeyGenParameterSpec.Builder(
                    SECRET_KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                    .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                    .build()

            keyGenerator.init(parameterSpec)
            keyGenerator.generateKey()
        }
    }

    private fun getSecretKey(): SecretKey? {
        if (!keyStore.containsAlias(SECRET_KEY_ALIAS))
            return null

        val secretKeyEntry = keyStore.getEntry(SECRET_KEY_ALIAS, null) as KeyStore.SecretKeyEntry
        return secretKeyEntry.secretKey
    }
}
