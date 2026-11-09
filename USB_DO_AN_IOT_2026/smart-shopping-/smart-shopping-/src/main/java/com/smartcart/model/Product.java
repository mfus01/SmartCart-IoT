package com.smartcart.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public class Product {

    @NotBlank(message = "ID san pham khong duoc de trong")
    private String id;

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

    public Product() {
    }

    public Product(
            String id,
            String name,
            String category,
            int price,
            String shelfId,
            int xCoord,
            int yCoord,
            String qrCode) {

        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.shelfId = shelfId;
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        this.qrCode = qrCode;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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