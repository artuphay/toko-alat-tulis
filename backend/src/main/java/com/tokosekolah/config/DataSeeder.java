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
            // Gambar contoh disajikan dari folder public/products di frontend
            productRepository.saveAll(List.of(
                product("Jepit Rambut Pita Pelangi", "Aksesori Rambut",
                        "Pita kain lembut warna pelangi, jepitan kuat tapi tidak menarik rambut.",
                        "15000", 60, "/products/jepit-pita-pelangi.svg"),
                product("Bando Telinga Kelinci", "Aksesori Rambut",
                        "Bando empuk dengan telinga kelinci lavender, nyaman dipakai seharian.",
                        "25000", 35, "/products/bando-kelinci.svg"),
                product("Scrunchie Pastel (isi 3)", "Aksesori Rambut",
                        "Ikat rambut kain pastel yang lembut, tidak bikin rambut kusut.",
                        "20000", 50, "/products/scrunchie-pastel.svg"),
                product("Gelang Manik Nama Custom", "Gelang & Kalung",
                        "Gelang manik warna-warni dengan huruf nama si kecil, dirangkai tangan.",
                        "18000", 40, "/products/gelang-manik-nama.svg"),
                product("Gantungan Kunci Beruang Rajut", "Gantungan Kunci",
                        "Boneka beruang rajut mungil, cocok untuk tas sekolah.",
                        "15000", 45, "/products/gantungan-kunci-beruang.svg"),
                product("Tas Selempang Mini Hati", "Tas & Dompet",
                        "Tas kecil warna mint dengan aplikasi hati, muat uang saku dan tisu.",
                        "45000", 20, "/products/tas-selempang-hati.svg")
            ));
        }
    }

    private Product product(String name, String category, String description,
                            String price, int stock, String imageUrl) {
        return Product.builder()
                .name(name)
                .category(category)
                .description(description)
                .price(new BigDecimal(price))
                .stock(stock)
                .imageUrl(imageUrl)
                .build();
    }
}
