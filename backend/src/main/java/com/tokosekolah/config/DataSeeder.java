package com.tokosekolah.config;

import com.tokosekolah.entity.Product;
import com.tokosekolah.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            productRepository.saveAll(List.of(
                Product.builder()
    .name("Kotak Pensil Karakter Lucu 3D")
    .category("Aksesori")
    .description("Bahan EVA tahan air, muat banyak alat tulis.")
    .price(new BigDecimal("35000"))
    .stock(50)
    .imageUrl("https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500")
    .build(),
                Product.builder()
                    .name("Set Pensil Warna Pastel 24 Warna")
                    .category("Alat Tulis")
                    .description("Warna lembut, tidak mudah patah, aman untuk anak.")
                    .price(new BigDecimal("48000"))
                    .stock(30)
                    .imageUrl("https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500")
                    .build(),
                Product.builder()
                    .name("Buku Tulis Bergaris Aesthetic (Pack isi 5)")
                    .category("Alat Tulis")
                    .description("Kertas tebal 80gsm tidak tembus tinta.")
                    .price(new BigDecimal("25000"))
                    .stock(100)
                    .imageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500")
                    .build()
            ));
        }
    }
}