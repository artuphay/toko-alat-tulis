package com.tokosekolah.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderCode;

    private String recipientName;
    private String phoneNumber;
    
    @Column(columnDefinition = "TEXT")
    private String shippingAddress;
    
    private String city;
    private String postalCode;
    private String notes;

    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    private String trackingNumber;

    // Isi QRIS dinamis (dengan nominal pesanan) yang digambar menjadi QR di halaman bayar
    @Column(length = 512)
    private String qrisPayload;

    // Diisi saat pembeli menekan "Saya Sudah Bayar"; admin tetap harus mengecek dana masuk
    private LocalDateTime paymentClaimedAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> items = new ArrayList<>();
}