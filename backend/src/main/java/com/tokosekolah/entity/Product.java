package com.tokosekolah.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nama produk wajib diisi")
    @Size(max = 120, message = "Nama produk maksimal 120 karakter")
    private String name;

    @NotBlank(message = "Kategori wajib diisi")
    private String category;

    @Size(max = 500, message = "Deskripsi maksimal 500 karakter")
    @Column(length = 500)
    private String description;

    @NotNull(message = "Harga wajib diisi")
    @DecimalMin(value = "0", message = "Harga tidak boleh negatif")
    private BigDecimal price;

    @NotNull(message = "Stok wajib diisi")
    @Min(value = 0, message = "Stok tidak boleh negatif")
    private Integer stock;

    @Column(length = 1000)
    private String imageUrl;
}
