package com.tokosekolah.dto;

import lombok.Data;
import java.util.List;

@Data
public class CheckoutRequest {
    private String recipientName;
    private String phoneNumber;
    private String shippingAddress;
    private String city;
    private String postalCode;
    private String notes;
    private List<ItemDto> items;

    @Data
    public static class ItemDto {
        private Long productId;
        private Integer quantity;
    }
}