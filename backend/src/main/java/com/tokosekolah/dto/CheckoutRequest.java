package com.tokosekolah.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class CheckoutRequest {
    @NotBlank(message = "Nama penerima wajib diisi")
    @Size(max = 100)
    private String recipientName;

    @NotBlank(message = "Nomor WhatsApp wajib diisi")
    @Size(max = 20)
    private String phoneNumber;

    @NotBlank(message = "Alamat wajib diisi")
    @Size(max = 500)
    private String shippingAddress;

    @NotBlank(message = "Kota wajib diisi")
    @Size(max = 100)
    private String city;

    @NotBlank(message = "Kode pos wajib diisi")
    @Size(max = 10)
    private String postalCode;

    @Size(max = 255)
    private String notes;

    @NotEmpty(message = "Keranjang masih kosong")
    @Valid
    private List<ItemDto> items;

    @Data
    public static class ItemDto {
        @NotNull
        private Long productId;

        @NotNull
        @Min(value = 1, message = "Jumlah minimal 1")
        @Max(value = 99, message = "Jumlah maksimal 99 per produk")
        private Integer quantity;
    }
}
