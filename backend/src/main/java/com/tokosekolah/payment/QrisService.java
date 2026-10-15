package com.tokosekolah.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;

/**
 * Mengubah QRIS statis Kima menjadi QRIS dinamis berisi nominal pesanan,
 * sehingga pembeli tidak perlu mengetik nominal sendiri.
 *
 * Format QRIS mengikuti EMV QR: deretan TLV (tag 2 digit, panjang 2 digit, nilai).
 * Perubahannya: tag 01 "11" (statis) menjadi "12" (dinamis), tag 54 (nominal)
 * ditambahkan, lalu CRC tag 63 dihitung ulang.
 */
@Slf4j
@Service
public class QrisService {

    private static final String TAG_POINT_OF_INITIATION = "01";
    private static final String TAG_AMOUNT = "54";
    private static final String TAG_CRC = "63";

    private final TreeMap<String, String> staticTags;

    public QrisService(@Value("${kima.qris.static-payload:}") String staticPayload) {
        this.staticTags = parseValidStatic(staticPayload);
    }

    public boolean isEnabled() {
        return staticTags != null;
    }

    /** QRIS dinamis untuk nominal tertentu, atau null jika QRIS statis belum dikonfigurasi dengan benar. */
    public String dynamicPayload(BigDecimal amount) {
        if (staticTags == null) {
            return null;
        }
        TreeMap<String, String> tags = new TreeMap<>(staticTags);
        tags.put(TAG_POINT_OF_INITIATION, "12");
        tags.put(TAG_AMOUNT, amount.setScale(0, RoundingMode.HALF_UP).toPlainString());
        tags.remove(TAG_CRC);

        StringBuilder payload = new StringBuilder();
        tags.forEach((tag, value) -> payload.append(tlv(tag, value)));
        payload.append(TAG_CRC).append("04");
        return payload.append(crc16(payload.toString())).toString();
    }

    static TreeMap<String, String> parse(String payload) {
        TreeMap<String, String> tags = new TreeMap<>();
        int i = 0;
        while (i < payload.length()) {
            if (i + 4 > payload.length()) {
                throw new IllegalArgumentException("TLV terpotong di posisi " + i);
            }
            String tag = payload.substring(i, i + 2);
            int length = Integer.parseInt(payload.substring(i + 2, i + 4));
            if (i + 4 + length > payload.length()) {
                throw new IllegalArgumentException("Panjang tag " + tag + " melebihi payload");
            }
            tags.put(tag, payload.substring(i + 4, i + 4 + length));
            i += 4 + length;
        }
        return tags;
    }

    /** CRC-16/CCITT-FALSE (poly 0x1021, awal 0xFFFF), seperti yang diwajibkan QRIS. */
    static String crc16(String data) {
        int crc = 0xFFFF;
        for (byte b : data.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (b & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return String.format("%04X", crc);
    }

    private static String tlv(String tag, String value) {
        if (value.length() > 99) {
            throw new IllegalArgumentException("Nilai tag " + tag + " terlalu panjang");
        }
        return tag + String.format("%02d", value.length()) + value;
    }

    private static TreeMap<String, String> parseValidStatic(String payload) {
        if (payload == null || payload.isBlank()) {
            log.warn("QRIS statis belum diset (kima.qris.static-payload); halaman bayar memakai gambar QRIS statis.");
            return null;
        }
        String trimmed = payload.trim();
        try {
            Map<String, String> tags = parse(trimmed);
            String crc = tags.get(TAG_CRC);
            if (crc == null || !crc.equalsIgnoreCase(crc16(trimmed.substring(0, trimmed.length() - 4)))) {
                throw new IllegalArgumentException("CRC tidak cocok");
            }
            if (!tags.containsKey("59") || !tags.containsKey("53")) {
                throw new IllegalArgumentException("Bukan payload QRIS merchant");
            }
            return new TreeMap<>(tags);
        } catch (RuntimeException e) {
            log.error("QRIS statis tidak valid ({}); halaman bayar memakai gambar QRIS statis.", e.getMessage());
            return null;
        }
    }
}
