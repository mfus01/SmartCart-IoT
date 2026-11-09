package com.smartcart.dto;

// ======================================================
// ROUTE POINT DTO
// Dai dien cho mot toa do tren ban do
// ======================================================

public class RoutePoint {

    private int x;
    private int y;


    // ==================================================
    // CONSTRUCTOR RONG
    // Jackson can constructor nay de doc JSON
    // ==================================================

    public RoutePoint() {
    }


    // ==================================================
    // CONSTRUCTOR CO THAM SO
    // ==================================================

    public RoutePoint(int x, int y) {
        this.x = x;
        this.y = y;
    }


    // ==================================================
    // GETTER / SETTER X
    // ==================================================

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }


    // ==================================================
    // GETTER / SETTER Y
    // ==================================================

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }
}