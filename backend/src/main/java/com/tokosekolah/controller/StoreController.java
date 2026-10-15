package com.tokosekolah.controller;

import com.tokosekolah.dto.CheckoutRequest;
import com.tokosekolah.entity.*;
import com.tokosekolah.payment.QrisService;
import com.tokosekolah.repository.OrderRepository;
import com.tokosekolah.repository.ProductImageRepository;
import com.tokosekolah.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

// Endpoint publik untuk pembeli.
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StoreController {

    private static final String ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ProductImageRepository productImageRepository;
    private final QrisService qrisService;

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productRepository.findAllByOrderByIdAsc();
    }

    @GetMapping("/images/{id}")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
        ProductImage image = productImageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gambar tidak ditemukan"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(image.getData());
    }

    @PostMapping("/checkout")
    @Transactional
    public Order checkout(@Valid @RequestBody CheckoutRequest request) {
        Order order = new Order();
        order.setOrderCode(newOrderCode());
        order.setRecipientName(request.getRecipientName().trim());
        order.setPhoneNumber(request.getPhoneNumber().trim());
        order.setShippingAddress(request.getShippingAddress().trim());
        order.setCity(request.getCity().trim());
        order.setPostalCode(request.getPostalCode().trim());
        order.setNotes(request.getNotes());

        BigDecimal total = BigDecimal.ZERO;

        for (CheckoutRequest.ItemDto itemDto : request.getItems()) {
            Product product = productRepository.findByIdForUpdate(itemDto.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Ada produk di keranjang yang sudah tidak tersedia"));

            if (product.getStock() < itemDto.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Stok " + product.getName() + " tinggal " + product.getStock());
            }

            product.setStock(product.getStock() - itemDto.getQuantity());

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
        order.setQrisPayload(qrisService.dynamicPayload(total));

        return orderRepository.save(order);
    }

    // Pembeli menandai sudah membayar lewat QRIS statis Kima. Status tetap menunggu sampai
    // admin mencocokkan dana masuk dan menekan "Tandai Lunas".
    @PostMapping("/orders/{orderCode}/payment-claim")
    @Transactional
    public Map<String, String> claimPayment(@PathVariable String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesanan tidak ditemukan"));
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT && order.getPaymentClaimedAt() == null) {
            order.setPaymentClaimedAt(LocalDateTime.now());
        }
        return Map.of("status", order.getStatus().name());
    }

    // Kode acak agar pesanan orang lain tidak bisa ditebak dari urutan waktu
    private static String newOrderCode() {
        StringBuilder code = new StringBuilder("KIMA-")
                .append(LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd")))
                .append('-');
        for (int i = 0; i < 6; i++) {
            code.append(ORDER_CODE_CHARS.charAt(RANDOM.nextInt(ORDER_CODE_CHARS.length())));
        }
        return code.toString();
    }
}
