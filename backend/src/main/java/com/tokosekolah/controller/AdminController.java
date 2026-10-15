package com.tokosekolah.controller;

import com.tokosekolah.entity.*;
import com.tokosekolah.repository.OrderRepository;
import com.tokosekolah.repository.ProductImageRepository;
import com.tokosekolah.repository.ProductRepository;
import com.tokosekolah.security.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

// Endpoint panel admin. Semua path /api/admin/** (kecuali login) dijaga AdminAuthInterceptor.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ProductImageRepository productImageRepository;
    private final AdminAuthService authService;

    // --- LOGIN ---
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) throws InterruptedException {
        if (!authService.checkPassword(body.get("password"))) {
            Thread.sleep(500); // perlambat tebak-tebakan password
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Password salah");
        }
        Instant expiresAt = Instant.now().plus(AdminAuthService.TOKEN_TTL);
        return Map.of("token", authService.issueToken(expiresAt), "expiresAt", expiresAt.toEpochMilli());
    }

    @GetMapping("/session")
    public Map<String, Boolean> session() {
        return Map.of("valid", true);
    }

    // --- UPLOAD FOTO ---
    @PostMapping("/upload")
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (file.isEmpty() || contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format foto harus JPG, PNG, WEBP, atau GIF");
        }

        ProductImage image = new ProductImage();
        image.setContentType(contentType);
        image.setData(file.getBytes());
        image = productImageRepository.save(image);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/images/{id}")
                .buildAndExpand(image.getId())
                .toUriString();
        return Map.of("url", url);
    }

    // --- MANAJEMEN PRODUK ---
    @PostMapping("/products")
    public Product addProduct(@Valid @RequestBody Product product) {
        product.setId(null);
        return productRepository.save(product);
    }

    @PutMapping("/products/{id}")
    @Transactional
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody Product details) {
        Product product = findProduct(id);
        product.setName(details.getName());
        product.setCategory(details.getCategory());
        product.setDescription(details.getDescription());
        product.setPrice(details.getPrice());
        product.setStock(details.getStock());
        product.setImageUrl(details.getImageUrl());
        return product;
    }

    @DeleteMapping("/products/{id}")
    public Map<String, String> deleteProduct(@PathVariable Long id) {
        productRepository.delete(findProduct(id));
        return Map.of("message", "Produk berhasil dihapus");
    }

    // --- PESANAN ---
    @GetMapping("/orders/ready-to-ship")
    public List<Order> getReadyToShipOrders() {
        return orderRepository.findByStatusOrderByPaidAtDesc(OrderStatus.PAID_READY_TO_SHIP);
    }

    @GetMapping("/orders/shipped")
    public List<Order> getShippedOrders() {
        return orderRepository.findByStatusOrderByPaidAtDesc(OrderStatus.SHIPPED);
    }

    @GetMapping("/orders/summary")
    public Map<String, Object> getSummary() {
        return Map.of(
            "readyToShipOrders", orderRepository.countByStatus(OrderStatus.PAID_READY_TO_SHIP),
            "pendingOrders", orderRepository.countByStatus(OrderStatus.PENDING_PAYMENT),
            "shippedOrders", orderRepository.countByStatus(OrderStatus.SHIPPED),
            "totalProducts", productRepository.count()
        );
    }

    @PutMapping("/orders/{id}/ship")
    @Transactional
    public Map<String, String> shipOrder(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesanan tidak ditemukan"));
        String trackingNumber = body.get("trackingNumber");
        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nomor resi wajib diisi");
        }
        if (order.getStatus() != OrderStatus.PAID_READY_TO_SHIP) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pesanan ini belum lunas atau sudah dikirim");
        }
        order.setStatus(OrderStatus.SHIPPED);
        order.setTrackingNumber(trackingNumber.trim());
        return Map.of("message", "Resi diperbarui!");
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produk tidak ditemukan"));
    }
}
