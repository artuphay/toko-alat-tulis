package com.tokosekolah.controller;

import com.tokosekolah.dto.CheckoutRequest;
import com.tokosekolah.entity.*;
import com.tokosekolah.repository.OrderRepository;
import com.tokosekolah.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ApiController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    // --- FITUR UPLOAD GAMBAR DARI KOMPUTER ---
    @PostMapping("/admin/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String uploadDir = "uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Nama file unik berdasarkan timestamp
            String cleanFileName = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            Path filePath = Paths.get(uploadDir + cleanFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "http://localhost:8080/uploads/" + cleanFileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Gagal mengupload gambar"));
        }
    }

    // --- MANAJEMEN PRODUK ---
    @GetMapping("/products")
    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    @PostMapping("/admin/products")
    public Product addProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @PutMapping("/admin/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product details) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));

        product.setName(details.getName());
        product.setCategory(details.getCategory());
        product.setDescription(details.getDescription());
        product.setPrice(details.getPrice());
        product.setStock(details.getStock());
        product.setImageUrl(details.getImageUrl());

        return ResponseEntity.ok(productRepository.save(product));
    }

    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        productRepository.deleteById(id);
        return ResponseEntity.ok("Produk berhasil dihapus");
    }

    // --- TRANSAKSI & QRIS ---
    @PostMapping("/checkout")
    @Transactional
    public Order checkout(@RequestBody CheckoutRequest request) {
        Order order = new Order();
        order.setOrderCode("ORD-" + System.currentTimeMillis());
        order.setRecipientName(request.getRecipientName());
        order.setPhoneNumber(request.getPhoneNumber());
        order.setShippingAddress(request.getShippingAddress());
        order.setCity(request.getCity());
        order.setPostalCode(request.getPostalCode());
        order.setNotes(request.getNotes());

        BigDecimal total = BigDecimal.ZERO;

        for (CheckoutRequest.ItemDto itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));

            if (product.getStock() < itemDto.getQuantity()) {
                throw new RuntimeException("Stok tidak cukup untuk: " + product.getName());
            }

            product.setStock(product.getStock() - itemDto.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setPrice(product.getPrice());

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            orderItem.setSubtotal(subtotal);
            order.getItems().add(orderItem);

            total = total.add(subtotal);
        }

        order.setTotalAmount(total);
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        String qrisUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY-QRIS-" + order.getOrderCode() + "-RP-" + total;
        order.setQrisUrl(qrisUrl);

        return orderRepository.save(order);
    }

    @PostMapping("/payment/simulate-pay/{orderCode}")
    public ResponseEntity<String> simulatePayment(@PathVariable String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Pesanan tidak ditemukan"));
        order.setStatus(OrderStatus.PAID_READY_TO_SHIP);
        order.setPaidAt(LocalDateTime.now());
        orderRepository.save(order);
        return ResponseEntity.ok("Pembayaran QRIS Berhasil!");
    }

    @GetMapping("/admin/orders/ready-to-ship")
    public List<Order> getReadyToShipOrders() {
        return orderRepository.findByStatusOrderByPaidAtDesc(OrderStatus.PAID_READY_TO_SHIP);
    }

    @GetMapping("/admin/orders/summary")
    public Map<String, Object> getSummary() {
        return Map.of(
            "readyToShipOrders", orderRepository.countByStatus(OrderStatus.PAID_READY_TO_SHIP),
            "pendingOrders", orderRepository.countByStatus(OrderStatus.PENDING_PAYMENT),
            "shippedOrders", orderRepository.countByStatus(OrderStatus.SHIPPED),
            "totalProducts", productRepository.count()
        );
    }

    @PutMapping("/admin/orders/{id}/ship")
    public ResponseEntity<String> shipOrder(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(OrderStatus.SHIPPED);
        order.setTrackingNumber(body.get("trackingNumber"));
        orderRepository.save(order);
        return ResponseEntity.ok("Resi diperbarui!");
    }
}