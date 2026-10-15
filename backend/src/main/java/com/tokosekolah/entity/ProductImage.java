package com.tokosekolah.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Foto produk disimpan di database agar tidak hilang saat server hosting restart.
@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductImage {
    public static final int MAX_BYTES = 5 * 1024 * 1024;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String contentType;

    @Column(nullable = false, length = MAX_BYTES)
    private byte[] data;

    private LocalDateTime createdAt = LocalDateTime.now();
}
