package com.tokosekolah.repository;

import com.tokosekolah.entity.Order;
import com.tokosekolah.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByStatusOrderByPaidAtDesc(OrderStatus status);
    long countByStatus(OrderStatus status);
}