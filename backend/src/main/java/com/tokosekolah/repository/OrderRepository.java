package com.tokosekolah.repository;

import com.tokosekolah.entity.Order;
import com.tokosekolah.entity.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = "items")
    Optional<Order> findByOrderCode(String orderCode);

    @EntityGraph(attributePaths = "items")
    List<Order> findByStatusOrderByPaidAtDesc(OrderStatus status);

    @EntityGraph(attributePaths = "items")
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    long countByStatus(OrderStatus status);
}
