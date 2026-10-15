package com.tokosekolah.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * Login admin sederhana: satu password dari env ADMIN_PASSWORD, token bertanda tangan HMAC.
 * Kunci HMAC diturunkan dari password, sehingga token tetap valid setelah server restart
 * dan otomatis batal kalau password diganti.
 */
@Slf4j
@Service
public class AdminAuthService {

    public static final Duration TOKEN_TTL = Duration.ofDays(7);

    private final byte[] passwordHash;
    private final SecretKeySpec signingKey;

    public AdminAuthService(@Value("${admin.password:}") String configuredPassword) {
        String password = configuredPassword;
        if (password == null || password.isBlank()) {
            password = randomPassword();
            log.warn("ADMIN_PASSWORD belum diset. Password admin sementara (berubah tiap restart): {}", password);
        }
        this.passwordHash = sha256(password);
        this.signingKey = new SecretKeySpec(sha256("kima-admin-token:" + password), "HmacSHA256");
    }

    public boolean checkPassword(String candidate) {
        return candidate != null && MessageDigest.isEqual(sha256(candidate), passwordHash);
    }

    public String issueToken(Instant expiresAt) {
        String payload = Long.toString(expiresAt.toEpochMilli());
        return payload + "." + sign(payload);
    }

    public boolean isValid(String token) {
        if (token == null) {
            return false;
        }
        int dot = token.indexOf('.');
        if (dot <= 0) {
            return false;
        }
        String payload = token.substring(0, dot);
        String signature = token.substring(dot + 1);
        if (!MessageDigest.isEqual(sign(payload).getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            return false;
        }
        try {
            return Instant.ofEpochMilli(Long.parseLong(payload)).isAfter(Instant.now());
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(signingKey);
            byte[] sig = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String randomPassword() {
        byte[] bytes = new byte[9];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
