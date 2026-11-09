package com.smartcart.dto;

import java.util.List;

// ======================================================
// ROUTE REQUEST DTO
// Nhan diem bat dau + danh sach san pham
// ======================================================

public class RouteRequest {

    private RoutePoint startPoint;

    private List<RouteProductRequest> products;


    public RouteRequest() {
    }


    public RoutePoint getStartPoint() {
        return startPoint;
    }

    public void setStartPoint(RoutePoint startPoint) {
        this.startPoint = startPoint;
    }


    public List<RouteProductRequest> getProducts() {
        return products;
    }

    public void setProducts(
            List<RouteProductRequest> products) {

        this.products = products;
    }
}