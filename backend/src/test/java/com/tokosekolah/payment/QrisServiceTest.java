package com.tokosekolah.payment;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class QrisServiceTest {

    // QRIS statis Kima Fashion and Accessories (tercetak di poster QRIS, bukan data rahasia)
    private static final String KIMA_STATIC =
            "00020101021126740022ID.CO.POSINDONESIA.WWW011893608161000009738702150000000000814900303UMI"
            + "51440014ID.CO.QRIS.WWW0215ID10265153730780303UMI5204565153033605802ID"
            + "5925Kima Fashion and Accessor6005bogor61051611062070703A016304B76A";

    @Test
    void crcMatchesPrintedStaticQris() {
        assertEquals("B76A", QrisService.crc16(KIMA_STATIC.substring(0, KIMA_STATIC.length() - 4)));
    }

    @Test
    void dynamicPayloadKeepsMerchantAndAddsAmount() {
        QrisService service = new QrisService(KIMA_STATIC);
        assertTrue(service.isEnabled());

        String dynamic = service.dynamicPayload(new BigDecimal("18000.00"));
        Map<String, String> tags = QrisService.parse(dynamic);
        Map<String, String> original = QrisService.parse(KIMA_STATIC);

        assertEquals("12", tags.get("01"));
        assertEquals("18000", tags.get("54"));
        for (String tag : new String[] {"00", "26", "51", "52", "53", "58", "59", "60", "61", "62"}) {
            assertEquals(original.get(tag), tags.get(tag), "tag " + tag + " harus sama dengan QRIS asli");
        }
        // tag nominal berada setelah mata uang (53) dan sebelum negara (58)
        assertTrue(dynamic.indexOf("5303360") < dynamic.indexOf("540518000"));
        assertTrue(dynamic.indexOf("540518000") < dynamic.indexOf("5802ID"));
        assertTrue(dynamic.endsWith(QrisService.crc16(dynamic.substring(0, dynamic.length() - 4))));
    }

    @Test
    void invalidStaticPayloadDisablesDynamicQris() {
        String corrupted = KIMA_STATIC.replace("bogor", "bogoR");
        QrisService service = new QrisService(corrupted);
        assertFalse(service.isEnabled());
        assertNull(service.dynamicPayload(BigDecimal.TEN));
        assertFalse(new QrisService("").isEnabled());
    }
}
