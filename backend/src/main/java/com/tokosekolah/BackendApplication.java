package com.tokosekolah;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        configureDatabaseFromEnv();
        SpringApplication.run(BackendApplication.class, args);
    }

    // Render/Neon/Supabase memberi DATABASE_URL berformat postgres://user:pass@host:port/db,
    // sedangkan JDBC butuh jdbc:postgresql://host:port/db + username/password terpisah.
    private static void configureDatabaseFromEnv() {
        String raw = System.getenv("DATABASE_URL");
        if (raw == null || raw.isBlank()) {
            return;
        }
        raw = raw.trim();
        if (raw.startsWith("jdbc:")) {
            System.setProperty("spring.datasource.url", raw);
            return;
        }

        URI uri = URI.create(raw);
        String port = uri.getPort() > 0 ? ":" + uri.getPort() : "";
        String query = uri.getRawQuery() != null ? "?" + uri.getRawQuery() : "";
        System.setProperty("spring.datasource.url", "jdbc:postgresql://" + uri.getHost() + port + uri.getRawPath() + query);

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            String[] parts = userInfo.split(":", 2);
            System.setProperty("spring.datasource.username", decode(parts[0]));
            System.setProperty("spring.datasource.password", parts.length > 1 ? decode(parts[1]) : "");
        }
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
