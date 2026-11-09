package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;


public class ProductUpdateRequest {

    @NotBlank(message = "Ten san pham khong duoc de trong")
    private String name;

    @NotBlank(message = "Danh muc san pham khong duoc de trong")
    private String category;

    @Positive(message = "Gia san pham phai lon hon 0")
    private int price;

    @NotBlank(message = "Ma ke hang khong duoc de trong")
    private String shelfId;

    @PositiveOrZero(message = "Toa do X khong duoc am")
    private int xCoord;

    @PositiveOrZero(message = "Toa do Y khong duoc am")
    private int yCoord;

    @NotBlank(message = "Ma QR khong duoc de trong")
    private String qrCode;

    public ProductUpdateRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    public String getShelfId() {
        return shelfId;
    }

    public void setShelfId(String shelfId) {
        this.shelfId = shelfId;
    }

    public int getXCoord() {
        return xCoord;
    }

    public void setXCoord(int xCoord) {
        this.xCoord = xCoord;
    }

    public int getYCoord() {
        return yCoord;
    }

    public void setYCoord(int yCoord) {
        this.yCoord = yCoord;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }
}