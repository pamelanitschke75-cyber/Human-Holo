package com.solholo.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class HoloReminderStore {
    private static final String PREFERENCES = "human_holo_private_reminders_v1";
    private static final String PAYLOAD = "encrypted_reminders";
    private static final String KEY_ALIAS = "human_holo_private_reminders_key_v1";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";

    private HoloReminderStore() {}

    static synchronized JSONArray list(Context context) throws Exception {
        SharedPreferences preferences = context.getSharedPreferences(
            PREFERENCES,
            Context.MODE_PRIVATE
        );
        String encrypted = preferences.getString(PAYLOAD, "");
        if (encrypted == null || encrypted.isEmpty()) {
            return new JSONArray();
        }
        return new JSONArray(decrypt(encrypted));
    }

    static synchronized JSONObject find(Context context, String id) throws Exception {
        JSONArray reminders = list(context);
        for (int index = 0; index < reminders.length(); index += 1) {
            JSONObject reminder = reminders.optJSONObject(index);
            if (reminder != null && id.equals(reminder.optString("id"))) {
                return new JSONObject(reminder.toString());
            }
        }
        return null;
    }

    static synchronized void upsert(Context context, JSONObject supplied) throws Exception {
        JSONArray current = list(context);
        JSONArray next = new JSONArray();
        String id = supplied.getString("id");
        boolean replaced = false;
        for (int index = 0; index < current.length(); index += 1) {
            JSONObject reminder = current.optJSONObject(index);
            if (reminder == null) continue;
            if (id.equals(reminder.optString("id"))) {
                next.put(new JSONObject(supplied.toString()));
                replaced = true;
            } else {
                next.put(reminder);
            }
        }
        if (!replaced) {
            next.put(new JSONObject(supplied.toString()));
        }
        write(context, next);
    }

    static synchronized boolean remove(Context context, String id) throws Exception {
        JSONArray current = list(context);
        JSONArray next = new JSONArray();
        boolean removed = false;
        for (int index = 0; index < current.length(); index += 1) {
            JSONObject reminder = current.optJSONObject(index);
            if (reminder == null) continue;
            if (id.equals(reminder.optString("id"))) {
                removed = true;
            } else {
                next.put(reminder);
            }
        }
        if (removed) {
            write(context, next);
        }
        return removed;
    }

    static String ownerHash(String ownerId) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(
            String.valueOf(ownerId).getBytes(StandardCharsets.UTF_8)
        );
        return Base64.encodeToString(hash, Base64.NO_WRAP);
    }

    private static void write(Context context, JSONArray reminders) throws Exception {
        String encrypted = encrypt(reminders.toString());
        boolean written = context
            .getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putString(PAYLOAD, encrypted)
            .commit();
        if (!written) {
            throw new IllegalStateException("REMINDER_STORE_WRITE_FAILED");
        }
    }

    private static SecretKey key() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return (SecretKey) keyStore.getKey(KEY_ALIAS, null);
        }

        KeyGenerator generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        );
        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build()
        );
        return generator.generateKey();
    }

    private static String encrypt(String clearText) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        byte[] encrypted = cipher.doFinal(
            clearText.getBytes(StandardCharsets.UTF_8)
        );
        return Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" +
            Base64.encodeToString(encrypted, Base64.NO_WRAP);
    }

    private static String decrypt(String payload) throws Exception {
        String[] parts = payload.split(":", 2);
        if (parts.length != 2) {
            throw new IllegalStateException("REMINDER_STORE_PAYLOAD_INVALID");
        }
        byte[] iv = Base64.decode(parts[0], Base64.NO_WRAP);
        byte[] encrypted = Base64.decode(parts[1], Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(
            Cipher.DECRYPT_MODE,
            key(),
            new GCMParameterSpec(128, iv)
        );
        return new String(
            cipher.doFinal(encrypted),
            StandardCharsets.UTF_8
        );
    }
}
