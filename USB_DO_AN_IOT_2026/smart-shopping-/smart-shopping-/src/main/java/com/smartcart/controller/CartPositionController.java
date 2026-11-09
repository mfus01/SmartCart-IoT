package com.smartcart.controller;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart-position")
public class CartPositionController {

    // Vi tri ban dau tai cua vao
    private final AtomicReference<Position> position =
            new AtomicReference<>(new Position(17, 111));

    public record Position(int x, int y) {}

    // Lay vi tri hien tai
    @GetMapping
    public Position getPosition() {
        return position.get();
    }

    // Cap nhat vi tri xe
    @PostMapping
    public ResponseEntity<?> updatePosition(
            @RequestBody Position newPosition) {

        if (newPosition == null
                || newPosition.x() < 0
                || newPosition.x() > 80
                || newPosition.y() < 0
                || newPosition.y() > 120) {

            return ResponseEntity.badRequest().body(
                Map.of("error", "Toa do khong hop le")
            );
        }

        position.set(newPosition);

        return ResponseEntity.ok(newPosition);
    }
}