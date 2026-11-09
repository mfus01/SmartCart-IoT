package com.smartcart.dto;

import java.util.List;

// ======================================================
// ROUTE RESPONSE DTO
// Chua danh sach cac diem tren lo trinh
// ======================================================

public class RouteResponse {

    private List<RoutePoint> routePoints;


    public RouteResponse() {
    }


    public RouteResponse(
            List<RoutePoint> routePoints) {

        this.routePoints = routePoints;
    }


    public List<RoutePoint> getRoutePoints() {
        return routePoints;
    }

    public void setRoutePoints(
            List<RoutePoint> routePoints) {

        this.routePoints = routePoints;
    }
}